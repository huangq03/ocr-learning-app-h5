import ImageAnalysis from '@azure-rest/ai-vision-image-analysis';
import { AzureKeyCredential } from '@azure/core-auth';

export async function runAzureVision(imageBuffer: Buffer): Promise<string> {
    const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
    const key = process.env.AZURE_COMPUTER_VISION_KEY;
    if (!endpoint || !key) throw new Error('Azure credentials not found.');
    const client = ImageAnalysis(endpoint, new AzureKeyCredential(key));
    const result = await client.path('imageanalysis:analyze').post({ body: imageBuffer, queryParameters: { features: ['text'] }, contentType: 'application/octet-stream' });
    return result.body.text?.value || '';
}
