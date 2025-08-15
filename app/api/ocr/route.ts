import { createWorker } from 'tesseract.js';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import ImageAnalysis from '@azure-rest/ai-vision-image-analysis';
import { AzureKeyCredential } from '@azure/core-auth';

// --- Tesseract Helper ---
async function runTesseract(imageBuffer: Buffer) {
    // 1. Detect orientation with a temporary legacy worker
    const detectionWorker = await createWorker('osd', { oem: 0 });
    const { data: detectionData } = await detectionWorker.detect(imageBuffer);
    await detectionWorker.terminate();

    let rotationAngle = detectionData.orientation_degrees || 0;
    console.log(`Tesseract detected orientation: ${rotationAngle} degrees`);

    // 2. Rotate image if necessary
    const rotatedImageBuffer = rotationAngle !== 0
        ? await sharp(imageBuffer).rotate(rotationAngle).toBuffer()
        : imageBuffer;

    // 3. Recognize text with the main LSTM worker
    const worker = await createWorker(['eng', 'chi_sim']);
    const { data: { text } } = await worker.recognize(rotatedImageBuffer);
    await worker.terminate();
    return text;
}

// --- Google Cloud Vision Helper ---
async function runGoogleVision(imageBuffer: Buffer) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error('Google Cloud credentials not found. Please set the GOOGLE_APPLICATION_CREDENTIALS environment variable.');
    }
    const client = new ImageAnnotatorClient();
    const request = {
        image: {
            content: imageBuffer.toString('base64'),
        },
        features: [{ type: 'TEXT_DETECTION' }],
    };
    const [result] = await client.textDetection(request);
    const detections = result.textAnnotations;
    return detections?.[0]?.description || '';
}

// --- Azure Computer Vision Helper ---
async function runAzureVision(imageBuffer: Buffer) {
    const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
    const key = process.env.AZURE_COMPUTER_VISION_KEY;
    if (!endpoint || !key) {
        throw new Error('Azure credentials not found. Please set AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY environment variables.');
    }
    const client = ImageAnalysis(endpoint, new AzureKeyCredential(key));
    const result = await client.path('imageanalysis:analyze').post({
        body: imageBuffer,
        queryParameters: {
            features: ['text'],
        },
        contentType: 'application/octet-stream',
    });
    return result.body.text?.value || '';
}

// --- AWS Textract Helper ---
async function runAwsTextract(imageBuffer: Buffer) {
    if (!process.env.AWS_REGION) {
         throw new Error('AWS credentials not found. Please set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.');
    }
    const client = new TextractClient({ region: process.env.AWS_REGION });
    const command = new DetectDocumentTextCommand({ Document: { Bytes: imageBuffer } });
    const result = await client.send(command);
    const blocks = result.Blocks || [];
    return blocks
        .filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n');
}

// --- Main API Route ---
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const service = (formData.get('service') as string) || 'tesseract';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const imageBuffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        switch (service) {
            case 'tesseract':
                text = await runTesseract(imageBuffer);
                break;
            case 'google':
                text = await runGoogleVision(imageBuffer);
                break;
            case 'azure':
                text = await runAzureVision(imageBuffer);
                break;
            case 'aws':
                text = await runAwsTextract(imageBuffer);
                break;
            default:
                return NextResponse.json({ error: 'Invalid service specified.' }, { status: 400 });
        }

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error(`Error in ${error.service || 'general'} OCR processing:`, error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}