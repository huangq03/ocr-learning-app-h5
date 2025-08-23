import { createWorker, WorkerOptions } from 'tesseract.js';

export async function runTesseract(imageBuffer: Buffer): Promise<string> {
    // The image buffer is now pre-rotated by the main API handler.
    // We can directly recognize the text.

    // Use CDN for Vercel deployments, otherwise use local setup
    const options: Partial<WorkerOptions> | undefined = process.env.VERCEL
      ? {
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
          corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0/tesseract-core.wasm',
          langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
        }
      : undefined;

    const worker = await createWorker(['eng', 'chi_sim'], undefined, options);
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    return text;
}