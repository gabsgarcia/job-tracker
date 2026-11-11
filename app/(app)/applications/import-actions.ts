"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ImportRow = {
  company: string;
  position: string;
  status: string;
  application_date: string;
  notes: string | null;
};

// Inserts the rows parsed in the browser. Every row gets the logged-in user's
// id, so RLS accepts it and only this user will see it.
export async function importApplications(rows: ImportRow[]) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false as const, error: "You are not logged in." };

  const valid = rows.filter((r) => r.company && r.position);
  if (valid.length === 0) return { ok: false as const, error: "No valid rows found in the file." };

  const { error } = await supabase
    .from("applications")
    .insert(valid.map((r) => ({ ...r, user_id: data.user!.id })));
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/applications");
  return { ok: true as const, imported: valid.length, skipped: rows.length - valid.length };
}
