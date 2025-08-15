
import { createWorker } from 'tesseract.js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const worker = await createWorker('eng');

    const imageBuffer = await file.arrayBuffer();
    const { data: { text } } = await worker.recognize(Buffer.from(imageBuffer));
    await worker.terminate();

    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during OCR processing' }, { status: 500 });
  }
}
