# Job Tracker

A small multi-user web app to keep track of job applications and the tasks for each one ("send follow-up email", "prepare case study"). Every user signs up with email and password and only sees their own data.

## Features

- Sign up, log in, log out, password reset (from the official Supabase starter).
- **Applications:** create, list, edit and delete. Fields: company, position, status, application date, notes.
- **Statuses:** `applied`, `interviewing`, `offered`, `rejected`, `withdrawn`.
- **Tasks:** add tasks to an application (title, optional due date), mark them as done, delete them. The **Tasks** page lists all your tasks.
- **Stats:** total applications, active applications, interview rate, open/overdue tasks, a bar chart by status and applications per week (last 12 weeks). Friendly empty state for new users.
- **CSV import:** import many applications at once from a CSV file (see `sample-applications.csv`).
- **Privacy:** Row Level Security in the database. Each user can only read and change their own rows.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Server Actions) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Postgres database + Auth)
- [Papa Parse](https://www.papaparse.com/) for reading CSV files

## Run it locally

You need Node.js (LTS) and a free Supabase account.

1. **Clone and install**
   ```bash
   git clone <this-repo-url>
   cd job-tracker
   npm install
   ```
2. **Create a Supabase project** and copy two values from *Project Settings → API Keys*: the **Project URL** and the **publishable key** (`sb_publishable_...`). Never use the secret key in this app.
3. **Environment variables:** copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
   `.env.local` is in `.gitignore` and must never be committed.
4. **Create the tables:** open Supabase → *SQL Editor*, paste the content of `supabase/migrations/001_initial_schema.sql` and click **Run**. You should see "Success. No rows returned". Run each migration file once, in order.
5. **Start the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, sign up with a real email, confirm it and log in.

## CSV format

```
company,position,status,application_date,notes
Nubank,Product Manager,applied,2026-08-18,
```

- `status` must be one of the five statuses above (lowercase).
- `application_date` uses `YYYY-MM-DD`.
- Save the file as UTF-8 with commas. Tip: opening and saving it in Excel with a Brazilian locale changes the separator to `;`.

## Project structure

```
app/(app)/applications   list, create, detail/edit, server actions, CSV import action
app/(app)/tasks          all tasks of the logged-in user
app/(app)/stats          KPIs and charts (lib/stats.ts does the math)
app/auth                 auth pages from the Supabase starter
components/              navbar, forms, task list, CSV import
lib/types.ts             statuses and types (must match the database)
supabase/migrations/     SQL to run in the Supabase SQL Editor
```
