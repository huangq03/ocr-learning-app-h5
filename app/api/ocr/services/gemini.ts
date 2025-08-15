import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLM_PROMPT } from './prompts';

export async function runGeminiCleanup(rawText: string): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not found.');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`${LLM_PROMPT}\n\n${rawText}`);
    const jsonString = result.response.text();
    return JSON.parse(jsonString);
}
