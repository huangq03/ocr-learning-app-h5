import { createWorker } from 'tesseract.js';

export async function runTesseract(imageBuffer: Buffer): Promise<string> {
    // The image buffer is now pre-rotated by the main API handler.
    // We can directly recognize the text.
    const worker = await createWorker(['eng', 'chi_sim']);
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    return text;
}