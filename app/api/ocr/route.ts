
import { createWorker } from 'tesseract.js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const worker = await createWorker('eng');
  const ret = await worker.recognize(file);
  await worker.terminate();

  return NextResponse.json({ text: ret.data.text });
}
