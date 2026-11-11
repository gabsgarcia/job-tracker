import { Button } from "@/components/ui/button";
import { deleteTask, toggleTask } from "@/app/(app)/applications/actions";
import type { Task } from "@/lib/types";

// One list used on the application detail page and on /tasks.
export function TaskList({
  tasks,
  returnTo,
  applicationNames,
}: {
  tasks: Task[];
  returnTo: string;
  applicationNames?: Record<string, string>;
}) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground">No tasks yet.</p>;
  }
  return (
    <ul className="divide-y rounded-lg border">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center justify-between gap-4 p-3">
          <div className={task.done ? "line-through text-muted-foreground" : ""}>
            <div>{task.title}</div>
            <div className="text-xs text-muted-foreground">
              {applicationNames?.[task.application_id] && (
                <span>{applicationNames[task.application_id]} · </span>
              )}
              {task.due_date ? `Due ${task.due_date}` : "No due date"}
            </div>
          </div>
          <div className="flex gap-2">
            <form action={toggleTask.bind(null, task.id, !task.done, returnTo)}>
              <Button size="sm" variant="outline" type="submit">
                {task.done ? "Reopen" : "Mark done"}
              </Button>
            </form>
            <form action={deleteTask.bind(null, task.id, returnTo)}>
              <Button size="sm" variant="destructive" type="submit">
                Delete
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
