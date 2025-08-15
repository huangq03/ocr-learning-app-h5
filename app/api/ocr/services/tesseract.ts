import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

export async function runTesseract(imageBuffer: Buffer): Promise<string> {
    // 1. Detect orientation with a temporary legacy worker
    const detectionWorker = await createWorker('osd', { oem: 0 });
    const { data: detectionData } = await detectionWorker.detect(imageBuffer);
    await detectionWorker.terminate();

    // 2. Calculate rotation angle based on the user-corrected logic
    let rotationAngle = detectionData.orientation_degrees || 0;

    // 3. Rotate image if necessary
    const rotatedImageBuffer = rotationAngle !== 0
        ? await sharp(imageBuffer).rotate(rotationAngle).toBuffer()
        : imageBuffer;

    // 4. Recognize text with the main LSTM worker
    const worker = await createWorker(['eng', 'chi_sim']);
    const { data: { text } } = await worker.recognize(rotatedImageBuffer);
    await worker.terminate();
    return text;
}
