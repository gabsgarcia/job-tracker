import { STATUSES, isStatus } from "@/lib/types";

// CSV import logic, built test-first (see csv-import.test.ts).
// No database and no browser here: just data in, data out.

export type ParsedRow = {
  company: string;
  position: string;
  status: string;
  application_date: string;
  notes: string | null;
};

type Key = keyof ParsedRow;
const KEYS: Key[] = ["company", "position", "status", "application_date", "notes"];

/** Turns one CSV row (header → value) into an application object. */
export function parseCSVRow(raw: Record<string, string | undefined>): ParsedRow {
  // Normalise the headers: " Company" → "company".
  const byKey: Partial<Record<Key, string>> = {};
  for (const [header, value] of Object.entries(raw)) {
    const key = header.trim().toLowerCase() as Key;
    if (KEYS.includes(key)) byKey[key] = (value ?? "").trim();
  }
  return {
    company: byKey.company ?? "",
    position: byKey.position ?? "",
    status: (byKey.status ?? "").toLowerCase(),
    application_date: byKey.application_date ?? "",
    notes: byKey.notes ? byKey.notes : null,
  };
}

/** True only for a real calendar date written as YYYY-MM-DD. */
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Returns the list of problems of a row. Empty list = the row can be imported. */
export function validateRow(row: ParsedRow): string[] {
  const errors: string[] = [];
  if (!row.company) errors.push("Missing company");
  if (!row.position) errors.push("Missing position");
  if (!isStatus(row.status))
    errors.push(`Invalid status "${row.status}" (use: ${STATUSES.join(", ")})`);
  if (!isValidDate(row.application_date))
    errors.push(`Invalid date "${row.application_date}" (use YYYY-MM-DD)`);
  return errors;
}

type Identity = Pick<ParsedRow, "company" | "position" | "application_date">;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Same company + position + application date as an existing record (case and spaces ignored). */
export function isDuplicate(row: Identity, existing: Identity[]): boolean {
  return existing.some(
    (e) =>
      norm(e.company) === norm(row.company) &&
      norm(e.position) === norm(row.position) &&
      e.application_date === row.application_date,
  );
}
