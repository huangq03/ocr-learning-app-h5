
import { createWorker } from 'tesseract.js';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

// Western Cloud Providers
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import ImageAnalysis from '@azure-rest/ai-vision-image-analysis';
import { AzureKeyCredential } from '@azure/core-auth';

// Chinese Cloud Providers
import Ocr20210707 from '@alicloud/ocr-api20210707';
import * as $OpenApi from '@alicloud/openapi-client';
import BaiduOcr from 'baidu-aip-sdk'.OcrClient;
import tencentcloud from 'tencentcloud-sdk-nodejs';

// Google Gemini for Cleanup
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Tesseract Helper ---
async function runTesseract(imageBuffer: Buffer) {
    const detectionWorker = await createWorker('osd', { oem: 0 });
    const { data: detectionData } = await detectionWorker.detect(imageBuffer);
    await detectionWorker.terminate();
    let rotationAngle = detectionData.orientation_degrees || 0;
    const rotatedImageBuffer = rotationAngle !== 0 ? await sharp(imageBuffer).rotate(rotationAngle).toBuffer() : imageBuffer;
    const worker = await createWorker(['eng', 'chi_sim']);
    const { data: { text } } = await worker.recognize(rotatedImageBuffer);
    await worker.terminate();
    return text;
}

// --- Google Cloud Vision Helper ---
async function runGoogleVision(imageBuffer: Buffer) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Google Cloud credentials not found.');
    const client = new ImageAnnotatorClient();
    const [result] = await client.textDetection({ image: { content: imageBuffer.toString('base64') } });
    return result.textAnnotations?.[0]?.description || '';
}

// --- Azure Computer Vision Helper ---
async function runAzureVision(imageBuffer: Buffer) {
    const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
    const key = process.env.AZURE_COMPUTER_VISION_KEY;
    if (!endpoint || !key) throw new Error('Azure credentials not found.');
    const client = ImageAnalysis(endpoint, new AzureKeyCredential(key));
    const result = await client.path('imageanalysis:analyze').post({ body: imageBuffer, queryParameters: { features: ['text'] }, contentType: 'application/octet-stream' });
    return result.body.text?.value || '';
}

// --- AWS Textract Helper ---
async function runAwsTextract(imageBuffer: Buffer) {
    if (!process.env.AWS_REGION) throw new Error('AWS credentials not found.');
    const client = new TextractClient({ region: process.env.AWS_REGION });
    const result = await client.send(new DetectDocumentTextCommand({ Document: { Bytes: imageBuffer } }));
    return (result.Blocks || []).filter(b => b.BlockType === 'LINE').map(b => b.Text).join('\n');
}

// --- Aliyun OCR Helper ---
async function runAliyunOcr(imageBuffer: Buffer) {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    if (!accessKeyId || !accessKeySecret) throw new Error('Aliyun credentials not found.');
    const config = new $OpenApi.Config({ accessKeyId, accessKeySecret, endpoint: 'ocr-api.cn-hangzhou.aliyuncs.com' });
    const client = new Ocr20210707(config);
    const request = new Ocr20210707.RecognizeGeneralRequest({ body: imageBuffer });
    const result = await client.recognizeGeneral(request);
    return result.body?.data?.content || '';
}

// --- Baidu Cloud OCR Helper ---
async function runBaiduOcr(imageBuffer: Buffer) {
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;
    if (!apiKey || !secretKey) throw new Error('Baidu Cloud credentials not found.');
    const client = new BaiduOcr(apiKey, secretKey);
    const result = await client.generalBasic(imageBuffer.toString('base64'));
    return (result.words_result || []).map((w: any) => w.words).join('\n');
}

// --- Tencent Cloud OCR Helper ---
async function runTencentOcr(imageBuffer: Buffer) {
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;
    const region = process.env.TENCENT_REGION;
    if (!secretId || !secretKey || !region) throw new Error('Tencent Cloud credentials not found.');
    const client = new tencentcloud.ocr.v20181119.Client({ credential: { secretId, secretKey }, region });
    const result = await client.GeneralBasicOCR({ ImageBase64: imageBuffer.toString('base64') });
    return (result.TextDetections || []).map(d => d.DetectedText).join('\n');
}

// --- LLM Cleanup Helper ---
async function runLlmCleanup(rawText: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not found. Please set the GEMINI_API_KEY environment variable.');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

    const prompt = `The following text is raw output from an OCR service. It may contain errors, incorrect spacing, and fragmented lines. Please clean it up. Correct any spelling and grammar mistakes, merge words that are incorrectly split, and format the text for readability. Return the result as a JSON object with the following structure: { "cleaned_text": "The full, corrected text as a single string.", "sentences": ["An array of the corrected sentences."], "key_phrases": ["A list of key words or phrases from the text."] }. Do not include the markdown characters \
```json\
 in your response. The raw text is: \n\n${rawText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text();
    return JSON.parse(jsonString);
}

// --- Main API Route ---
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const service = (formData.get('service') as string) || 'tesseract';
        const performCleanup = formData.get('cleanup') === 'true';

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const imageBuffer = Buffer.from(await file.arrayBuffer());
        let rawText = '';

        switch (service) {
            case 'tesseract': rawText = await runTesseract(imageBuffer); break;
            case 'google': rawText = await runGoogleVision(imageBuffer); break;
            case 'azure': rawText = await runAzureVision(imageBuffer); break;
            case 'aws': rawText = await runAwsTextract(imageBuffer); break;
            case 'aliyun': rawText = await runAliyunOcr(imageBuffer); break;
            case 'baidu': rawText = await runBaiduOcr(imageBuffer); break;
            case 'tencent': rawText = await runTencentOcr(imageBuffer); break;
            default: return NextResponse.json({ error: 'Invalid service specified.' }, { status: 400 });
        }

        if (performCleanup) {
            const cleanedJson = await runLlmCleanup(rawText);
            return NextResponse.json(cleanedJson);
        } else {
            return NextResponse.json({ text: rawText });
        }

    } catch (error: any) {
        console.error(`Error in OCR processing for service: ${error.service || 'unknown'}:`, error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
