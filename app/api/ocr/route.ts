
import { createWorker } from 'tesseract.js';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

// OCR Providers
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import ImageAnalysis from '@azure-rest/ai-vision-image-analysis';
import { AzureKeyCredential } from '@azure/core-auth';
import Ocr20210707 from '@alicloud/ocr-api20210707';
import * as $OpenApi from '@alicloud/openapi-client';
import BaiduOcr from 'baidu-aip-sdk'.OcrClient;
import tencentcloud from 'tencentcloud-sdk-nodejs';

// LLM Providers
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { Generation } from 'dashscope';

// --- OCR Service Implementations ---
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

async function runGoogleVision(imageBuffer: Buffer) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Google Cloud credentials not found.');
    const client = new ImageAnnotatorClient();
    const [result] = await client.textDetection({ image: { content: imageBuffer.toString('base64') } });
    return result.textAnnotations?.[0]?.description || '';
}

async function runAzureVision(imageBuffer: Buffer) {
    const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
    const key = process.env.AZURE_COMPUTER_VISION_KEY;
    if (!endpoint || !key) throw new Error('Azure credentials not found.');
    const client = ImageAnalysis(endpoint, new AzureKeyCredential(key));
    const result = await client.path('imageanalysis:analyze').post({ body: imageBuffer, queryParameters: { features: ['text'] }, contentType: 'application/octet-stream' });
    return result.body.text?.value || '';
}

async function runAwsTextract(imageBuffer: Buffer) {
    if (!process.env.AWS_REGION) throw new Error('AWS credentials not found.');
    const client = new TextractClient({ region: process.env.AWS_REGION });
    const result = await client.send(new DetectDocumentTextCommand({ Document: { Bytes: imageBuffer } }));
    return (result.Blocks || []).filter(b => b.BlockType === 'LINE').map(b => b.Text).join('\n');
}

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

async function runBaiduOcr(imageBuffer: Buffer) {
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;
    if (!apiKey || !secretKey) throw new Error('Baidu Cloud credentials not found.');
    const client = new BaiduOcr(apiKey, secretKey);
    const result = await client.generalBasic(imageBuffer.toString('base64'));
    return (result.words_result || []).map((w: any) => w.words).join('\n');
}

async function runTencentOcr(imageBuffer: Buffer) {
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;
    const region = process.env.TENCENT_REGION;
    if (!secretId || !secretKey || !region) throw new Error('Tencent Cloud credentials not found.');
    const client = new tencentcloud.ocr.v20181119.Client({ credential: { secretId, secretKey }, region });
    const result = await client.GeneralBasicOCR({ ImageBase64: imageBuffer.toString('base64') });
    return (result.TextDetections || []).map(d => d.DetectedText).join('\n');
}

// --- LLM Cleanup Helpers ---
const LLM_PROMPT = `The following text is raw output from an OCR service. It may contain errors, incorrect spacing, and fragmented lines. Please clean it up. Correct any spelling and grammar mistakes, merge words that are incorrectly split, and format the text for readability. Return the result as a JSON object with the following structure: { 