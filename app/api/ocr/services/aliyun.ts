import Ocr20210707, { RecognizeAdvancedRequest } from '@alicloud/ocr-api20210707';
import * as $OpenApi from '@alicloud/openapi-client';
import { Readable } from 'stream';

export async function runAliyunOcr(imageBuffer: Buffer): Promise<string> {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    if (!accessKeyId || !accessKeySecret) throw new Error('Aliyun credentials not found.');

    const config = new $OpenApi.Config({
        accessKeyId,
        accessKeySecret,
        endpoint: 'ocr-api.cn-hangzhou.aliyuncs.com'
    });

    const client = new Ocr20210707(config);

    // Convert Buffer to Readable stream
    const imageStream = Readable.from(imageBuffer);

    const request = new RecognizeAdvancedRequest({
        body: imageStream,
        NeedRotate: true
    });

    const result = await client.recognizeAdvanced(request);

    // Parse the JSON string in result.body.data
    if (result.body?.data) {
        try {
            const data = JSON.parse(result.body.data);
            return data.content || '';
        } catch (error) {
            console.error('Error parsing Aliyun OCR result:', error);
            return '';
        }
    }

    return '';
}
