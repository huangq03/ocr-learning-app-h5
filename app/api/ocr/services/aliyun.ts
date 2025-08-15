import Ocr20210707 from '@alicloud/ocr-api20210707';
import * as $OpenApi from '@alicloud/openapi-client';

export async function runAliyunOcr(imageBuffer: Buffer): Promise<string> {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    if (!accessKeyId || !accessKeySecret) throw new Error('Aliyun credentials not found.');
    const config = new $OpenApi.Config({ accessKeyId, accessKeySecret, endpoint: 'ocr-api.cn-hangzhou.aliyuncs.com' });
    const client = new Ocr20210707(config);
    const request = new Ocr20210707.RecognizeGeneralRequest({ body: imageBuffer });
    const result = await client.recognizeGeneral(request);
    return result.body?.data?.content || '';
}
