-- 002_saved_status_and_job_url.sql
-- 1. New status "saved": a job you found but have not applied to yet.
-- 2. New optional column job_url: the link to the job posting.
-- Run once in Supabase → SQL Editor → Run. Expected result: "Success. No rows returned".

alter table public.applications drop constraint applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn'));

alter table public.applications add column job_url text
  check (job_url is null or job_url ~* '^https?://');
