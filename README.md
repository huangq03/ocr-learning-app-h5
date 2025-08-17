# OCR Learning App

This is a full-stack web application built with Next.js that allows users to capture text from images, create study lists from that text, and practice using interactive study sessions. It's designed to help users quickly turn physical documents or screenshots into digital learning materials.

## Features

- **Document Capture**: Upload images or use the device camera to capture documents.
- **OCR Processing**: Extracts text from images using a backend OCR engine.
- **Smart Item Detection**: Intelligently scans the extracted text to find and suggest potential items (words and phrases) for study, highlighting them for review.
- **Interactive Approval**: Users can click on highlighted text or use an "Add" button to approve suggested items and build their study list.
- **Study Session Creation**: Users can select which items from a document they want to study.
- **Multiple Study Modes**:
  - **Recitation**: A flashcard-style mode for reading and reviewing items.
  - **Dictation**: An interactive mode that uses browser speech synthesis to read items aloud for spelling and listening practice.
- **Dashboard**: An overview of user statistics, including total documents, total items, and recent activity.
- **Internationalization (i18n)**: Full support for English and Chinese, switchable at runtime.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & DB**: [Supabase](https://supabase.com/) (Authentication, Postgres Database, Storage)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Internationalization**: [react-i18next](https://react.i18next.com/)

## Setup and Installation

### 1. Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or later)
- [pnpm](https://pnpm.io/) (or npm/yarn)

### 2. Clone the Repository

```bash
git clone <repository_url>
cd ocr-learning-app
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Set up Supabase

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com), create a new project, and save your project's URL and `anon` key.
2.  **Configure Environment Variables**: Create a new file named `.env.local` in the root of the project by copying the example file:
    ```bash
    cp .env.example .env.local
    ```
3.  **Add Supabase Keys**: Open `.env.local` and add your Supabase project URL and anon key:
    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

### 5. Set up Database Schema

This is a critical step. You must run the SQL scripts in the `/scripts` directory in the correct order to set up your database tables, storage, and functions.

Navigate to the **SQL Editor** in your Supabase project dashboard and run the contents of the following files **one by one, in this specific order**:

1.  `scripts/001_create_initial_schema.sql`
2.  `scripts/002_create_storage_bucket.sql`
3.  `scripts/003_create_functions_and_triggers.sql`
4.  `scripts/004_create_app_tables.sql`
5.  `scripts/005_create_progress_table.sql`

After running these scripts, your database will be ready.

## Running the Application

To start the development server, run:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/app`: Contains the pages of the application, following the Next.js App Router structure.
- `/components`: Contains all React components, including UI components from shadcn/ui.
- `/lib`: Contains helper functions, Supabase client configurations, and type definitions.
- `/scripts`: Contains all the SQL scripts needed to initialize the database schema.
- `/i18n`: Contains the configuration and locale files for internationalization.