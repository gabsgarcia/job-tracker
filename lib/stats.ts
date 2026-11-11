import { STATUSES, type Application, type Status, type Task } from "@/lib/types";

// Pure functions: no database, no dates from the clock unless passed in.
// That makes them easy to test and avoids time-zone surprises on Vercel (UTC).

export type Stats = {
  total: number; // applications actually sent (everything except "saved")
  saved: number; // jobs saved for later, not applied yet
  active: number; // applied + interviewing
  interviewRate: number | null; // (interviewing + offered) / total, null when total = 0
  offers: number;
  byStatus: { status: Status; count: number }[];
  perWeek: { weekStart: string; count: number }[]; // last N weeks, oldest first
  openTasks: number;
  overdueTasks: number;
  doneTasks: number;
};

/** Monday of the week of a YYYY-MM-DD date, as YYYY-MM-DD (computed in UTC, no shift). */
export function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Today's date in São Paulo as YYYY-MM-DD (the Vercel server runs in UTC). */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export function computeStats(
  apps: Pick<Application, "status" | "application_date">[],
  tasks: Pick<Task, "done" | "due_date">[],
  today: string,
  weeks = 12,
): Stats {
  const count = (s: Status) => apps.filter((a) => a.status === s).length;
  const saved = count("saved");
  const total = apps.length - saved;

  const byStatus = STATUSES.map((status) => ({ status, count: count(status) }));
  const interviewing = count("interviewing");
  const offers = count("offered");

  // Build the last `weeks` week buckets ending with the current week.
  const current = weekStart(today);
  const buckets: { weekStart: string; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${current}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7 * i);
    buckets.push({ weekStart: d.toISOString().slice(0, 10), count: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.weekStart, i]));
  for (const a of apps) {
    if (a.status === "saved") continue;
    const i = index.get(weekStart(a.application_date));
    if (i !== undefined) buckets[i].count++;
  }

  const open = tasks.filter((t) => !t.done);
  return {
    total,
    saved,
    active: count("applied") + interviewing,
    interviewRate: total === 0 ? null : (interviewing + offers) / total,
    offers,
    byStatus,
    perWeek: buckets,
    openTasks: open.length,
    overdueTasks: open.filter((t) => t.due_date !== null && t.due_date < today).length,
    doneTasks: tasks.length - open.length,
  };
}
