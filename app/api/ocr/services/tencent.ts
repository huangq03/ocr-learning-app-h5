import * as tencentcloud from 'tencentcloud-sdk-nodejs';

export async function runTencentOcr(imageBuffer: Buffer): Promise<string> {
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;
    const region = process.env.TENCENT_REGION;
    if (!secretId || !secretKey || !region) throw new Error('Tencent Cloud credentials not found.');
    const client = new tencentcloud.ocr.v20181119.Client({ credential: { secretId, secretKey }, region });
    const result = await client.GeneralBasicOCR({ ImageBase64: imageBuffer.toString('base64') });
    return (result.TextDetections || []).map(d => d.DetectedText).join('\n');
}
