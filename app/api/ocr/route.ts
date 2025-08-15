import { NextResponse } from 'next/server';

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

// --- Main API Route ---
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const service = (formData.get('service') as string) || 'tesseract';
        const performCleanup = formData.get('cleanup') === 'true';
        const llmService = (formData.get('llm_service') as string) || 'gemini';

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
            let cleanedJson;
            switch (llmService) {
                case 'gemini': cleanedJson = await runGeminiCleanup(rawText); break;
                case 'openai': cleanedJson = await runOpenAi(rawText); break;
                case 'qwen': cleanedJson = await runQwenCleanup(rawText); break;
                case 'deepseek': cleanedJson = await runDeepseek(rawText); break;
                case 'doubao': cleanedJson = await runDoubao(rawText); break;
                default: return NextResponse.json({ error: 'Invalid LLM service specified.' }, { status: 400 });
            }
            return NextResponse.json(cleanedJson);
        } else {
            return NextResponse.json({ text: rawText });
        }

    } catch (error: any) {
        console.error(`Error in processing:`, error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}