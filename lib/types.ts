// Single source of truth for statuses in the code.
// It MUST match the check constraint in supabase/migrations/001_initial_schema.sql.
export const STATUSES = [
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
