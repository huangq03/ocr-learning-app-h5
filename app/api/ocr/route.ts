
import { createWorker } from 'tesseract.js';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'dist', 'worker.min.js');
  const langPath = path.join(process.cwd(), 'node_modules', 'tesseract.js-core');

  if (!fs.existsSync(workerPath)) {
    return NextResponse.json({ error: 'Tesseract worker not found' }, { status: 500 });
  }

  const worker = await createWorker('eng', 1, {
    workerPath,
    langPath,
    corePath: path.join(langPath, 'tesseract-core.wasm.js'),
  });

  const ret = await worker.recognize(file);
  await worker.terminate();

  return NextResponse.json({ text: ret.data.text });
}
