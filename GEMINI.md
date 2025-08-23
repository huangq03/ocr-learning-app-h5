# GEMINI.MD: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview & Purpose

* **Primary Goal:** This is a full-stack web application designed to help users learn from text captured from images. Users can upload or capture images, have the text extracted via OCR, create study lists from the extracted content, and then use interactive sessions (like flashcards or dictation) to study.
* **Business Domain:** Educational Technology (EdTech) / Language Learning

## 2. Core Technologies & Stack

* **Languages:** TypeScript
* **Frameworks & Runtimes:** Next.js (App Router), Node.js
* **Databases:** Supabase (PostgreSQL) or PostgreSQL for database, authentication, and storage.
* **Key Libraries/Dependencies:**
    *   **UI:** shadcn/ui, Tailwind CSS, Radix UI components
    *   **Forms:** react-hook-form, zod
    *   **Internationalization (i18n):** react-i18next, i18next
    *   **OCR Services:** The project is configured to use multiple OCR providers, including Aliyun, AWS Textract, Azure, Baidu, Google Cloud Vision, OpenAI, and Tesseract.js.
* **Package Manager(s):** pnpm

## 3. Architectural Patterns

* **Overall Architecture:** A full-stack application built within a single Next.js project. It uses the App Router paradigm, with frontend components and backend API routes co-located. The backend logic is exposed as serverless functions via Next.js API routes.
* **Directory Structure Philosophy:**
    *   `/app`: Core application logic, including pages (`/app/(pages)`) and API endpoints (`/app/api`).
    *   `/components`: Shared and reusable React components, including a `ui` subdirectory for shadcn/ui components.
    *   `/lib`: Utility functions, database implementations, and shared type definitions.
    *   `/scripts`: SQL scripts for database schema creation and migration.
    *   `/i18n`: Configuration and locale files for internationalization.
    *   `/public`: Static assets like images and logos.

## 4. Coding Conventions & Style Guide

* **Formatting:** While no `.prettierrc` or `.eslintrc` file is present, the code consistently uses 2 spaces for indentation.
* **Naming Conventions:**
    *   `variables`, `functions`: camelCase (`myVariable`)
    *   `classes`, `components`: PascalCase (`MyComponent`)
    *   `files`: kebab-case (`my-component.tsx`)
* **API Design:** The API endpoints are located in `/app/api/` and generally follow RESTful principles.
* **Error Handling:** Asynchronous operations primarily use `async/await` with `try...catch` blocks for error handling.

## 5. Key Files & Entrypoints

* **Main Entrypoint(s):**
    *   Frontend: `app/layout.tsx` (root layout) and `app/page.tsx` (main page).
    *   Backend: API routes are defined in `app/api/**/route.ts`.
* **Configuration:**
    *   `next.config.mjs`: Next.js configuration.
    *   `tsconfig.json`: TypeScript configuration.
    *   `.env.local`: Environment variables (requires setup for Supabase).
* **CI/CD Pipeline:** There is no CI/CD pipeline configured in this repository.

## 6. Development & Testing Workflow

* **Local Development Environment:**
    1.  Choose between Supabase or PostgreSQL as your database backend by setting the `DATABASE_TYPE` environment variable.
    2.  If using Supabase, set up Supabase and create a `.env.local` file with the appropriate keys.
    3.  If using PostgreSQL, set up PostgreSQL and create a `.env.local` file with the `DATABASE_URL`.
    4.  Run the SQL scripts in the `/scripts` directory to initialize the database.
    5.  Install dependencies using `pnpm install`.
    6.  Run the development server with `pnpm dev`.
* **Testing:** There is no testing framework or test files set up in this project.
* **CI/CD Process:** Not applicable.

## 7. Specific Instructions for AI Collaboration

* **Contribution Guidelines:** No `CONTRIBUTING.md` file exists. Follow existing patterns in the codebase.
* **Infrastructure (IaC):** The database schema is managed via SQL scripts in the `/scripts` directory. Any changes to the database structure should be done by creating a new, numbered SQL script.
* **Security:** Ensure that no secrets or API keys are hardcoded. Use the `.env.local` file for all sensitive information.
* **Dependencies:** Use `pnpm install` to add or update dependencies.
* **Commit Messages:** Run `git log -n 5` to see the latest commit messages and follow the established style.