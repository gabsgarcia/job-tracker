import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationFields } from "@/components/application-fields";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { TaskList } from "@/components/task-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import type { Application, Task } from "@/lib/types";
import { createTask, deleteApplication, updateApplication } from "../actions";

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const { message, error } = await searchParams;
  const supabase = await createClient();

  // With RLS, another user's application simply "does not exist" here.
  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle<Application>();
  if (!app) notFound();

  const { data: taskRows } = await supabase
    .from("tasks")
    .select("*")
    .eq("application_id", id)
    .order("done")
    .order("due_date", { ascending: true, nullsFirst: false });
  const tasks = (taskRows ?? []) as Task[];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/applications" className="text-sm text-muted-foreground hover:underline">
          ← All applications
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {app.company} · {app.position}
          </h1>
          <StatusBadge status={app.status} />
        </div>
      </div>
      <Flash message={message} error={error} />

      <section className="rounded-lg border p-4 flex flex-col gap-4">
        <h2 className="font-semibold">Edit application</h2>
        <form action={updateApplication.bind(null, app.id)} className="flex flex-col gap-4">
          <ApplicationFields app={app} />
          <div>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
        <form action={deleteApplication.bind(null, app.id)}>
          <Button type="submit" variant="destructive" size="sm">
            Delete application
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">Tasks</h2>
        <form action={createTask.bind(null, app.id)} className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1 flex-1 min-w-48">
            <Label htmlFor="title">New task</Label>
            <Input id="title" name="title" placeholder="Send follow-up email" required />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="due_date">Due date</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <Button type="submit">Add task</Button>
        </form>
        <TaskList tasks={tasks} returnTo={`/applications/${app.id}`} />
      </section>
    </div>
  );
}
