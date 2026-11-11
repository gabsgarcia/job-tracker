"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStatus } from "@/lib/types";

// Every action runs with the logged-in user's session, so the database RLS
// policies decide what each user can read and write. No secret key anywhere.

function back(path: string, kind: "message" | "error", text: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(text)}`);
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/login");
  return { supabase, user: data.user };
}

function readApplicationForm(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const status = String(formData.get("status") ?? "applied");
  const application_date = String(formData.get("application_date") ?? "");
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const jobUrlRaw = String(formData.get("job_url") ?? "").trim();

  if (!company || !position) return { error: "Company and position are required." } as const;
  if (!isStatus(status)) return { error: `Invalid status: ${status}` } as const;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(application_date))
    return { error: "Please choose a valid application date." } as const;
  if (jobUrlRaw && !/^https?:\/\//i.test(jobUrlRaw))
    return { error: "The job link must start with http:// or https://" } as const;

  return {
    values: {
      company,
      position,
      status,
      application_date,
      notes: notesRaw || null,
      job_url: jobUrlRaw || null,
    },
  } as const;
}

// ── Applications ────────────────────────────────────────────────────────────

export async function createApplication(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = readApplicationForm(formData);
  if ("error" in parsed) back("/applications", "error", parsed.error!);

  const { error } = await supabase
    .from("applications")
    .insert({ ...parsed.values, user_id: user.id });
  if (error) back("/applications", "error", `Could not save: ${error.message}`);

  revalidatePath("/applications");
  back("/applications", "message", "Application added.");
}

export async function updateApplication(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const path = `/applications/${id}`;
  const parsed = readApplicationForm(formData);
  if ("error" in parsed) back(path, "error", parsed.error!);

  // Read the old status first, so we know if this edit just turned it into an offer.
  const { data: before } = await supabase
    .from("applications")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("applications").update(parsed.values).eq("id", id);
  if (error) back(path, "error", `Could not update: ${error.message}`);

  revalidatePath("/applications");
  revalidatePath(path);
  revalidatePath("/stats");
  if (parsed.values.status === "offered" && before?.status !== "offered") {
    redirect(`${path}?celebrate=1&message=${encodeURIComponent("Offer received! 🎉")}`);
  }
  back(path, "message", "Application updated.");
}

// Called from the Kanban board on drop. Returns the error instead of
// redirecting, so the board can roll back its optimistic move.
export async function updateApplicationStatus(
  id: string,
  status: string,
): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  if (!isStatus(status)) return { error: `Invalid status: ${status}` };

  const { error } = await supabase.from("applications").update({ status }).eq("id", id);
  if (error) return { error: `Could not update: ${error.message}` };

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/stats");
  return {};
}

export async function deleteApplication(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) back(`/applications/${id}`, "error", `Could not delete: ${error.message}`);

  revalidatePath("/applications");
  revalidatePath("/tasks");
  back("/applications", "message", "Application deleted (and its tasks).");
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export async function createTask(applicationId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const path = `/applications/${applicationId}`;
  const title = String(formData.get("title") ?? "").trim();
  const due = String(formData.get("due_date") ?? "");
  if (!title) back(path, "error", "Task title is required.");

  const { error } = await supabase.from("tasks").insert({
    application_id: applicationId,
    user_id: user.id,
    title,
    due_date: due || null,
  });
  if (error) back(path, "error", `Could not add task: ${error.message}`);

  revalidatePath(path);
  revalidatePath("/tasks");
  back(path, "message", "Task added.");
}

export async function toggleTask(taskId: string, done: boolean, returnTo: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").update({ done }).eq("id", taskId);
  if (error) back(returnTo, "error", `Could not update task: ${error.message}`);

  revalidatePath(returnTo);
  revalidatePath("/tasks");
  back(returnTo, "message", done ? "Task marked as done." : "Task reopened.");
}

export async function deleteTask(taskId: string, returnTo: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) back(returnTo, "error", `Could not delete task: ${error.message}`);

  revalidatePath(returnTo);
  revalidatePath("/tasks");
  back(returnTo, "message", "Task deleted.");
}
