import { Generation } from 'dashscope';
import { LLM_PROMPT } from './prompts';

export async function runQwenCleanup(rawText: string): Promise<any> {
    const apiKey = process.env.ALIYUN_DASHSCOPE_API_KEY;
    if (!apiKey) throw new Error('Aliyun Dashscope (Qwen) API key not found.');
    const gen = new Generation();
    const result = await gen.call({
        model: 'qwen-turbo',
        prompt: `${LLM_PROMPT}\n\n${rawText}`,
        apiKey: apiKey,
    });
    const jsonString = result.output.text;
    return JSON.parse(jsonString);
}
