// Public URL of the app, used for absolute links in metadata, sitemap and robots.
// On Vercel, VERCEL_PROJECT_PRODUCTION_URL is the main domain (also in preview builds),
// so shared links always point to production.
export const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const siteName = "Job Tracker";
export const siteTitle = "Job Tracker: your job search, organized";
export const siteDescription =
  "Track every job application in one place. Paste a job link and AI fills in the details, move applications across a Kanban board, add follow-up tasks and see your interview rate. Free.";
