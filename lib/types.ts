// Single source of truth for statuses in the code.
// It MUST match the check constraint in supabase/migrations/ (latest: 002_saved_status_and_job_url.sql).
// "saved" = a job you found but have not applied to yet.
export const STATUSES = [
  "saved",
  "applied",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
] as const;

export type Status = (typeof STATUSES)[number];

export type Application = {
  id: string;
  user_id: string;
  company: string;
  position: string;
  status: Status;
  application_date: string; // YYYY-MM-DD
  notes: string | null;
  job_url: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  application_id: string;
  title: string;
  due_date: string | null; // YYYY-MM-DD
  done: boolean;
  created_at: string;
};

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}
