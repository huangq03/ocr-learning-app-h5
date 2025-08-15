# Multi-Cloud OCR Service API

This project is a Next.js API that provides a unified interface for performing Optical Character Recognition (OCR) and subsequent cleanup using Large Language Models (LLMs). It allows you to easily switch between a local Tesseract.js engine and various major cloud-based services to compare results and choose the best provider for your needs.

## Features

- **Unified API:** A single `/api/ocr` endpoint for all services.
- **Dynamic Service Selection:** Choose your OCR engine and LLM cleanup service on a per-request basis.
- **Automatic Orientation Correction:** For the local Tesseract engine, the API automatically detects text orientation and rotates the image for improved accuracy.
- **Multi-language Support:** Configured for both English and Simplified Chinese.

### Supported OCR Services

- **Local:**
  - Tesseract.js (`tesseract`) - *Default*
- **Western Cloud Providers:**
  - Google Cloud Vision (`google`)
  - Microsoft Azure Computer Vision (`azure`)
  - Amazon Web Services (AWS) Textract (`aws`)
- **Chinese Cloud Providers:**
  - Aliyun (Alibaba Cloud) (`aliyun`)
  - Baidu Cloud (`baidu`)
  - Tencent Cloud (`tencent`)

### Supported LLM Cleanup Services

- Google Gemini (`gemini`) - *Default*
- OpenAI (`openai`)
- Qwen (Aliyun) (`qwen`)
- DeepSeek (`deepseek`)
- Doubao (`doubao`)

## Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd <project_directory>
   ```

2. **Install dependencies:**
   This project uses `pnpm` as the package manager.
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to a new file named `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and fill in the necessary API credentials for the cloud services you wish to use. See the `.env.example` file for the full list of required variables.

4. **Run the development server:**
   ```bash
   next dev
   ```

## API Usage

Make a `POST` request to the `/api/ocr` endpoint with `multipart/form-data`.

### Parameters

- `file`: The image file you want to process.
- `service` (optional): The OCR engine to use. Defaults to `tesseract`.
- `cleanup` (optional): Set to `true` to enable LLM cleanup of the OCR output.
- `llm_service` (optional): The LLM engine to use for cleanup. Defaults to `gemini`. Possible values are `gemini`, `openai`, `qwen`, `deepseek`, `doubao`.

### Example Request with `curl`

```bash
# Using the default Tesseract engine
curl -X POST -F "file=@/path/to/your/image.png" http://localhost:3000/api/ocr

# Using Google Cloud Vision with Gemini cleanup
curl -X POST -F "file=@/path/to/your/image.png" -F "service=google" -F "cleanup=true" -F "llm_service=gemini" http://localhost:3000/api/ocr

# Using Tesseract with OpenAI cleanup
curl -X POST -F "file=@/path/to/your/image.png" -F "cleanup=true" -F "llm_service=openai" http://localhost:3000/api/ocr
```
