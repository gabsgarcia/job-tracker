import { Flash } from "@/components/flash";
import { TaskList } from "@/components/task-list";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { message, error } = await searchParams;
  const supabase = await createClient();

  const [{ data: taskRows }, { data: apps }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .order("done")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("applications").select("id, company, position"),
  ]);
  const tasks = (taskRows ?? []) as Task[];
  const names = Object.fromEntries(
    (apps ?? []).map((a) => [a.id, `${a.company} (${a.position})`]),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-sm text-muted-foreground">
        All your tasks across applications. To add a task, open an application.
      </p>
      <Flash message={message} error={error} />
      <TaskList tasks={tasks} returnTo="/tasks" applicationNames={names} />
    </div>
  );
}
