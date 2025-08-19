import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

// OCR Service Imports
import { runTesseract } from './services/tesseract';
import { runGoogleVision } from './services/google';
import { runAzureVision } from './services/azure';
import { runAwsTextract } from './services/aws';
import { runAliyunOcr } from './services/aliyun';
import { runBaiduOcr } from './services/baidu';
import { runTencentOcr } from './services/tencent';

// LLM Cleanup Service Imports
import { runGeminiCleanup } from './services/gemini';
import { runOpenAi, runDeepseek, runDoubao } from './services/openai';
import { runQwenCleanup } from './services/qwen';

// --- Helper Function for Image Preprocessing ---
async function correctImageOrientation(imageBuffer: Buffer): Promise<Buffer> {
    try {
        // Use Tesseract to detect orientation
        const detectionWorker = await createWorker('osd', { oem: 0 });
        const { data: { orientation_degrees } } = await detectionWorker.detect(imageBuffer);
        await detectionWorker.terminate();

        if (orientation_degrees && orientation_degrees !== 0) {
            console.log(`Correcting image orientation by ${orientation_degrees} degrees.`);
            return sharp(imageBuffer).rotate(orientation_degrees).toBuffer();
        }
        // If no rotation needed, return original buffer
        return imageBuffer;
    } catch (error) {
        console.error("Error during image orientation correction:", error);
        // Return original buffer if correction fails
        return imageBuffer;
    }
}

// --- Main API Route ---
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const service = (formData.get('service') as string) || 'aliyun';
        const performCleanup = true;
        const llmService = (formData.get('llm_service') as string) || 'qwen';

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const initialBuffer = Buffer.from(await file.arrayBuffer());
        
        // --- Apply orientation correction to all images ---
        const imageBuffer = await correctImageOrientation(initialBuffer);

        let rawText = '';

        // Pass the corrected buffer to all services
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
        console.log('OCR raw result: ', rawText);

        if (performCleanup) {
            let cleanedJson;
            switch (llmService) {
                case 'gemini': cleanedJson = await runGeminiCleanup(rawText); break;
                case 'openai': cleanedJson = await runOpenAi(rawText); break;
                case 'qwen': cleanedJson = await runQwenCleanup(rawText); break;
                case 'deepseek': cleanedJson = await runDeepseek(rawText); break;
                case 'doubao': cleanedJson = await runDoubao(rawText); break;
                default: return NextResponse.json({ error: 'Invalid LLM service specified.' }, { status: 400 });
            }

            // Reorder items based on their position in cleaned_text
            if (cleanedJson && cleanedJson.cleaned_text && Array.isArray(cleanedJson.items)) {
                const { cleaned_text, items } = cleanedJson;
                const sortedItems = [...items].sort((a, b) => {
                    const indexA = cleaned_text.indexOf(a);
                    const indexB = cleaned_text.indexOf(b);
                    
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;

                    return indexA - indexB;
                });
                cleanedJson.items = sortedItems;
            }

            console.log('cleaned json: ', cleanedJson);
            return NextResponse.json(cleanedJson);
        } else {
            return NextResponse.json({ text: rawText });
        }

    } catch (error: any) {
        console.error(`Error in processing:`, error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
