"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isDuplicate, validateRow, type ParsedRow } from "@/lib/csv-import";

// Inserts the rows the user confirmed in the preview. The rows are validated
// again here (never trust the browser) with the same tested functions.
export async function importApplications(rows: ParsedRow[]) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: "You are not logged in." };

  const { data: existing, error: loadError } = await supabase
    .from("applications")
    .select("company, position, application_date");
  if (loadError) return { ok: false as const, error: loadError.message };

  const accepted: ParsedRow[] = [];
  for (const row of rows) {
    if (validateRow(row).length > 0) continue;
    if (isDuplicate(row, [...(existing ?? []), ...accepted])) continue;
    accepted.push(row);
  }
  if (accepted.length === 0) return { ok: true as const, imported: 0, skipped: rows.length };

  const { error } = await supabase
    .from("applications")
    .insert(accepted.map((r) => ({ ...r, user_id: auth.user!.id })));
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/applications");
  return { ok: true as const, imported: accepted.length, skipped: rows.length - accepted.length };
}
