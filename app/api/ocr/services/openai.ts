import OpenAI from 'openai';
import { LLM_PROMPT } from './prompts';

async function runOpenAiCleanup(rawText: string, apiKey?: string, baseURL?: string, model = "gpt-4-turbo") {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OpenAI API key not found.');
    const openai = new OpenAI({ apiKey: key, baseURL });
    const completion = await openai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: LLM_PROMPT },
            { role: "user", content: rawText },
        ],
    });
    const jsonString = completion.choices[0].message.content;
    return JSON.parse(jsonString || '{}');
}

export async function runOpenAi(rawText: string): Promise<any> {
    return runOpenAiCleanup(rawText);
}

export async function runDeepseek(rawText: string): Promise<any> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL;
    if (!apiKey || !baseURL) throw new Error('DeepSeek credentials not found.');
    return runOpenAiCleanup(rawText, apiKey, baseURL, 'deepseek-chat');
}

export async function runDoubao(rawText: string): Promise<any> {
    const apiKey = process.env.DOUBAO_API_KEY;
    const baseURL = process.env.DOUBAO_BASE_URL;
    if (!apiKey || !baseURL) throw new Error('Doubao credentials not found.');
    return runOpenAiCleanup(rawText, apiKey, baseURL, 'Doubao-pro-4k');
}
