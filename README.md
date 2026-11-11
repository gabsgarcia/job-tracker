# Job Tracker

**Live app: https://job-tracker-mauve-nine.vercel.app**

A multi-user web app to keep track of job applications and the tasks for each one ("send follow-up email", "prepare case study"). Paste a job link or a job description and the form fills itself, move applications across a Kanban board, and follow your numbers on a stats page. Every user signs up with email and password and only sees their own data.

Built during the Le Wagon *AI Product Builder* bootcamp.

## Features

### Applications
- **Quick add:** paste a job **link** or the job **description** and the "New application" form is filled in for you (company, position, location, link). You review it and save; nothing is saved automatically.
  - Greenhouse, Lever and Ashby links are read through their public APIs.
  - Gupy and any career page that publishes schema.org `JobPosting` data (the data Google for Jobs reads) are read from the page itself.
  - Pasted text (e.g. copied from LinkedIn) and pages without structured data are read by **Claude** (optional, needs an Anthropic API key).
- **List and Kanban board:** switch between a list and a board with one column per status. **Drag and drop** a card to change its status. The move shows instantly and is rolled back if saving fails. Works with mouse, touch (press and hold) and keyboard.
- **Statuses:** `saved` (found, not applied yet), `applied`, `interviewing`, `offered`, `rejected`, `withdrawn`.
- Create, edit and delete applications. Fields: company, position, status, application date, job link, notes.
- **CSV import with preview:** pick a CSV file, see which rows will be imported and which will be skipped (and why), then confirm. Rows without company or position, with an unknown status, with an invalid date, or duplicated (same company + position + date, ignoring case and spaces) are skipped. Example files: `sample-applications.csv` (10 valid rows) and `test-to-break.csv` (rows that must be rejected).

### Tasks
- Add tasks to an application (title, optional due date), mark them as done, delete them. The **Tasks** page lists all your tasks.

### Stats
- Total applications, active applications, interview rate, open/overdue tasks, a bar chart by status and applications per week (last 12 weeks). Saved jobs are kept out of the totals and rates, since you haven't applied yet. Friendly empty state for new users.

### Look and feel
- **Color schemes:** pick Indigo, Ocean, Forest, Sunset, Rose or Neutral from the palette icon in the navbar, each with light and dark mode. The choice is remembered in your browser.
- **Animations:** 🎉 confetti when an application becomes an offer, lists that fade in one item after another, growing chart bars. All animations are turned off when the system asks for reduced motion.

### Privacy and security
- Row Level Security in the database: each user can only read and change their own rows.
- The Anthropic API key is only used on the server.
- Quick add never fetches local or private network addresses.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Server Actions) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Postgres database + Auth)
- [Claude API](https://platform.claude.com) (`@anthropic-ai/sdk`, structured outputs) for reading job descriptions
- [dnd-kit](https://dndkit.com) for drag and drop, [canvas-confetti](https://github.com/catdad/canvas-confetti) for the offer celebration
- [Papa Parse](https://www.papaparse.com/) for reading CSV files
- [Vitest](https://vitest.dev/) for unit tests
- Deployed on [Vercel](https://vercel.com)

## Run it locally

You need **Node.js 22** (20.19+ works too) and a free Supabase account.

1. **Clone and install**
   ```bash
   git clone https://github.com/gabsgarcia/job-tracker.git
   cd job-tracker
   npm install
   ```
2. **Create a Supabase project** and copy two values from *Project Settings → API Keys*: the **Project URL** and the **publishable key** (`sb_publishable_...`). Never use the secret key in this app.
3. **Environment variables:** copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ANTHROPIC_API_KEY=...   # optional, enables AI in Quick add
   ```
   `.env.local` is in `.gitignore` and must never be committed. Get an Anthropic key at *platform.claude.com → Settings → API keys*. Without it, everything works except reading pasted text and pages without structured data.
4. **Create the tables:** open Supabase → *SQL Editor* and run each file of `supabase/migrations/` once, **in order**:
   - `001_initial_schema.sql`: tables, indexes and Row Level Security
   - `002_saved_status_and_job_url.sql`: the `saved` status and the job link column

   Each one should end with "Success. No rows returned".
5. **Demo data (optional):** sign up in the app first, then paste `supabase/seed.sql` in the SQL Editor, replace `YOUR_EMAIL@example.com` with your login email and click **Run**. You get 14 applications (every status) and their tasks. Running it twice duplicates the data.
6. **Run the tests** (CSV import, stats and job link parsing, no database or network needed)
   ```bash
   npm test
   ```
7. **Start the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, sign up with a real email, confirm it and log in.

## Deploy on Vercel

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new). Next.js is detected automatically.
2. Add the same environment variables as in `.env.local` (*Settings → Environment Variables*).
3. In Supabase → *Authentication → URL Configuration*:
   - **Site URL:** your production URL, e.g. `https://job-tracker-mauve-nine.vercel.app`
   - **Redirect URLs:** `https://<your-app>.vercel.app/**` and `http://localhost:3000/**`

   Without this, the confirmation and password reset emails link to the wrong place.

Every push to `main` deploys a new version.

## CSV format

```
company,position,status,application_date,notes
Nubank,Product Manager,applied,2026-08-18,
```

- `status` must be one of the six statuses above (lowercase).
- `application_date` uses `YYYY-MM-DD`.
- Save the file as UTF-8 with commas. Tip: opening and saving it in Excel with a Brazilian locale changes the separator to `;`.

## Project structure

```
app/(app)/applications   list + Kanban, create, detail/edit, server actions,
                         CSV import action, Quick add action (quick-add-actions.ts)
app/(app)/tasks          all tasks of the logged-in user
app/(app)/stats          KPIs and charts (lib/stats.ts does the math)
app/auth                 auth pages from the Supabase starter
components/              navbar, forms, Kanban board, task list, CSV import,
                         Quick add form, color scheme picker
lib/job-links.ts         recognizes job links and reads each site's data (tested)
lib/ai-extract-job.ts    reads a job posting with Claude (structured output)
lib/csv-import.ts        parseCSVRow, validateRow, isDuplicate (tested)
lib/stats.ts             stats calculations (tested)
lib/palettes.ts          color schemes (CSS in app/globals.css)
lib/types.ts             statuses and types (must match the database)
supabase/migrations/     SQL to run in the Supabase SQL Editor, in order
supabase/seed.sql        optional demo data
```
