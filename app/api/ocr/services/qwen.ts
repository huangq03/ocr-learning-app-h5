import { payload } from 'dashscope';
import { LLM_PROMPT } from './prompts';

const GENERATION_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

export async function runQwenCleanup(rawText: string): Promise<any> {
    const apiKey = process.env.ALIYUN_DASHSCOPE_API_KEY;
    if (!apiKey) throw new Error('Aliyun Dashscope (Qwen) API key not found.');

    const requestData = {
        model: 'qwen-turbo',
        input: {
            prompt: `${LLM_PROMPT}\n\n${rawText}`
        },
        parameters: {}
    };

    const result = await payload(GENERATION_URL, requestData, apiKey);

    if (result.output && result.output.text) {
        return JSON.parse(result.output.text);
    } else {
        throw new Error('Unexpected response format from Qwen API');
    }
}
