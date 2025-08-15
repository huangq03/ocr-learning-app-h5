import BaiduOcr from 'baidu-aip-sdk';

export async function runBaiduOcr(imageBuffer: Buffer): Promise<string> {
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;
    if (!apiKey || !secretKey) throw new Error('Baidu Cloud credentials not found.');
    const client = new BaiduOcr.OcrClient(apiKey, secretKey);
    const result = await client.generalBasic(imageBuffer.toString('base64'));
    return (result.words_result || []).map((w: any) => w.words).join('\n');
}
