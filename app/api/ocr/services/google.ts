import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function runGoogleVision(imageBuffer: Buffer): Promise<string> {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Google Cloud credentials not found.');
    const client = new ImageAnnotatorClient();
    const [result] = await client.textDetection({ image: { content: imageBuffer.toString('base64') } });
    return result.textAnnotations?.[0]?.description || '';
}
