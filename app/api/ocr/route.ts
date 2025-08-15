
import { createWorker } from 'tesseract.js';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());

    // 1. Detect orientation with a temporary legacy worker
    const detectionWorker = await createWorker('osd', {
      oem: 0, // Use the legacy Tesseract engine
    });
    const { data: detectionData } = await detectionWorker.detect(imageBuffer);
    await detectionWorker.terminate();

    console.log('Detected orientation data:', detectionData);

    // Correctly calculate rotation angle based on orientation_degrees
    let rotationAngle = 0;
    switch (detectionData.orientation_degrees) {
      case 90:
        rotationAngle = 90;
        break;
      case 180:
        rotationAngle = 180;
        break;
      case 270:
        rotationAngle = 270;
        break;
    }
    console.log(`Applying rotation of ${rotationAngle} degrees`);

    // 2. Rotate image if necessary
    const rotatedImageBuffer = rotationAngle !== 0
      ? await sharp(imageBuffer).rotate(rotationAngle).toBuffer()
      : imageBuffer;

    // 3. Recognize text with the main LSTM worker
    const worker = await createWorker(['eng', 'chi_sim']);
    const { data: { text } } = await worker.recognize(rotatedImageBuffer);
    await worker.terminate();

    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during OCR processing' }, { status: 500 });
  }
}
