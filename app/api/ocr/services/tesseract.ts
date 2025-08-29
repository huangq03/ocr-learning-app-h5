import { createWorker, WorkerOptions } from 'tesseract.js';

export async function runTesseract(imageBuffer: Buffer): Promise<string> {
    // The image buffer is now pre-rotated by the main API handler.
    // We can directly recognize the text.

    const options: Partial<WorkerOptions> = {
        langPath: './tesseract-data',
        cachePath: './tesseract-data',
        workerPath: './node_modules/tesseract.js/dist/worker.min.js'
    };

    const worker = await createWorker(['eng', 'chi_sim'], undefined, options);
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    return text;
}