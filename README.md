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
- **JWT-based Authentication**: Secure authentication for both Supabase and PostgreSQL using JSON Web Tokens.
- **Internationalization (i18n)**: Full support for English and Chinese, switchable at runtime.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & DB**: [Supabase](https://supabase.com/) (Authentication, Postgres Database, Storage) or [PostgreSQL](https://www.postgresql.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [jose](https://github.com/panva/jose)
- **Internationalization**: [react-i18next](https://react-i18next.com/)

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

### 4. Configure Database

The application supports two database options:
1. **Supabase** (default) - A hosted PostgreSQL database with additional features
2. **PostgreSQL** - A self-hosted PostgreSQL database

#### Option 1: Using Supabase (Default)

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com), create a new project, and save your project's URL and `anon` key.
2.  **Configure Environment Variables**: Create a new file named `.env.local` in the root of the project by copying the example file:
    ```bash
    cp .env.example .env.local
    ```
3.  **Add Supabase Keys**: Open `.env.local` and add your Supabase project URL and anon key:
    ```
    DATABASE_TYPE=supabase
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

#### Option 2: Using PostgreSQL

1.  **Set up PostgreSQL**: Install and configure a PostgreSQL database.
2.  **Configure Environment Variables**: Create a new file named `.env.local` in the root of the project by copying the example file:
    ```bash
    cp .env.example .env.local
    ```
3.  **Add Database Connection**: Open `.env.local` and configure the database connection:
    ```
    DATABASE_TYPE=postgres
    DATABASE_URL=postgresql://username:password@host:port/database
    ```

### 5. Set up Database Schema

This is a critical step. You must run the SQL scripts to set up your database tables, storage, and functions.

#### For Supabase

Navigate to the **SQL Editor** in your Supabase project dashboard and run the contents of the following files **one by one, in this specific order**:

1.  `scripts/001_create_initial_schema.sql`
2.  `scripts/002_create_storage_bucket.sql`
3.  `scripts/003_create_functions_and_triggers.sql`
4.  `scripts/007_create_add_to_study_plan_function.sql`
5.  `scripts/008_create_dashboard_functions.sql`

#### For PostgreSQL

Run the following scripts in your PostgreSQL client **one by one, in this specific order**:

1.  `scripts/postgres/001_create_users_and_documents_tables.sql`
2.  `scripts/postgres/002_create_text_items_table.sql`
3.  `scripts/postgres/003_create_spaced_repetition_schedule_table.sql`
4.  `scripts/postgres/004_create_user_progress.sql`
5.  `scripts/postgres/005_create_selections_and_reviews_tables.sql`
6.  `scripts/postgres/006_create_dictation_exercises_table.sql`
7.  `scripts/postgres/007_create_dashboard_functions.sql`
8.  `scripts/postgres/008_create_add_to_study_plan_function.sql`
9.  `scripts/postgres/009_add_exercises_table.sql`

After running these scripts, your database will be ready.

## Running the Application

To start the development server, run:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Running with Docker and Let's Encrypt

This project includes a `docker-compose.yml` file to run the application and an Nginx proxy with SSL certificates from Let's Encrypt.

### Prerequisites

- A public server with Docker and Docker Compose installed.
- A registered domain name pointing to the server's IP address.
- Ports 80 and 443 open on the server's firewall.

### Steps

1.  **Update Configuration Files:**
    *   In `docker-compose.yml`, replace `your-email@example.com` with your actual email address.
    *   In both `docker-compose.yml` and `nginx/nginx.conf`, replace `your-domain.com` with your actual domain name.

2.  **Run the Initialization Script:**
    *   Before starting the containers, run the following command to download the necessary TLS parameters:
        ```bash
        ./init-letsencrypt.sh
        ```

3.  **Start the Nginx and App Containers:**
    *   Bring up the `app` and `nginx` services:
        ```bash
        docker-compose up -d app nginx
        ```

4.  **Obtain the SSL Certificate:**
    *   Run the following command to start the `certbot` container and request the certificate. Make sure you have replaced the placeholder domain and email in this command as well.
        ```bash
        docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email your-email@example.com --agree-tos --no-eff-email -d your-domain.com
        ```

5.  **Restart Nginx:**
    *   After the certificate is successfully generated, restart the Nginx container to load the new SSL configuration:
        ```bash
        docker-compose restart nginx
        ```

Your application should now be accessible via `https://your-domain.com`. The certificate will be automatically renewed.

## Project Structure

- `/app`: Contains the pages of the application, following the Next.js App Router structure.
- `/components`: Contains all React components, including UI components from shadcn/ui.
- `/lib`: Contains helper functions, database implementations, and type definitions.
- `/scripts`: Contains all the SQL scripts needed to initialize the database schema.
- `/i18n`: Contains the configuration and locale files for internationalization.