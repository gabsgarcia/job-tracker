import type { Status } from "@/lib/types";

const colors: Record<Status, string> = {
  saved: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  interviewing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  offered: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  withdrawn: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
}
