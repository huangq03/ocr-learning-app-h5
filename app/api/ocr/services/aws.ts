import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';

export async function runAwsTextract(imageBuffer: Buffer): Promise<string> {
    if (!process.env.AWS_REGION) throw new Error('AWS credentials not found.');
    const client = new TextractClient({ region: process.env.AWS_REGION });
    const result = await client.send(new DetectDocumentTextCommand({ Document: { Bytes: imageBuffer } }));
    return (result.Blocks || []).filter(b => b.BlockType === 'LINE').map(b => b.Text).join('\n');
}
