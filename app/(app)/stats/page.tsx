import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeStats, todayInSaoPaulo } from "@/lib/stats";
import { enterClass, staggerStyle } from "@/lib/stagger";
import type { Application, Task } from "@/lib/types";

export const metadata: Metadata = { title: "Stats" };

function Kpi({
  label,
  value,
  hint,
  index,
}: {
  label: string;
  value: string;
  hint?: string;
  index: number;
}) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${enterClass}`} style={staggerStyle(index, 80)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export default async function StatsPage() {
  const supabase = await createClient();

  // Same logged-in client as the other pages: RLS keeps the numbers per user.
  const [{ data: apps }, { data: tasks }] = await Promise.all([
    supabase.from("applications").select("status, application_date"),
    supabase.from("tasks").select("done, due_date"),
  ]);
  const today = todayInSaoPaulo();
  const s = computeStats(
    (apps ?? []) as Pick<Application, "status" | "application_date">[],
    (tasks ?? []) as Pick<Task, "done" | "due_date">[],
    today,
  );

  if (s.total === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Stats</h1>
        <div className="rounded-lg border p-8 text-center flex flex-col gap-2">
          <p className="font-medium">No applications yet, so no stats yet.</p>
          <p className="text-sm text-muted-foreground">
            Add your first application (or import a CSV) and your numbers will show up here.
          </p>
          <Link href="/applications" className="text-sm underline">
            Go to Applications
          </Link>
        </div>
      </div>
    );
  }

  const maxStatus = Math.max(...s.byStatus.map((b) => b.count), 1);
  const maxWeek = Math.max(...s.perWeek.map((w) => w.count), 1);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Stats</h1>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Kpi
          index={0}
          label="Total applications"
          value={String(s.total)}
          hint={s.saved > 0 ? `+ ${s.saved} saved for later` : undefined}
        />
        <Kpi index={1} label="Active" value={String(s.active)} hint="applied + interviewing" />
        <Kpi
          index={2}
          label="Interview rate"
          value={s.interviewRate === null ? "–" : `${Math.round(s.interviewRate * 100)}%`}
          hint="(interviewing + offered) ÷ total"
        />
        <Kpi
          index={3}
          label="Open tasks"
          value={String(s.openTasks)}
          hint={s.overdueTasks > 0 ? `${s.overdueTasks} overdue` : "none overdue"}
        />
      </section>

      <section className="rounded-lg border p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Applications by status</h2>
        {s.byStatus.map(({ status, count }, i) => (
          <div key={status} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0">{status}</span>
            <div className="flex-1 h-4 rounded bg-muted">
              <div
                className="h-4 origin-left animate-grow-x rounded bg-primary"
                style={{ width: `${(count / maxStatus) * 100}%`, animationDelay: `${i * 80}ms` }}
              />
            </div>
            <span className="w-6 text-right tabular-nums">{count}</span>
          </div>
        ))}
      </section>

      <section className="rounded-lg border p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Applications per week (last 12 weeks)</h2>
        <div className="flex items-end gap-1 h-40">
          {s.perWeek.map((w, i) => (
            <div key={w.weekStart} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-xs tabular-nums">{w.count || ""}</span>
              <div
                className="w-full origin-bottom animate-grow-y rounded-t bg-primary"
                style={{ height: `${(w.count / maxWeek) * 100}%`, animationDelay: `${i * 40}ms` }}
                title={`Week of ${w.weekStart}: ${w.count}`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1 text-[10px] text-muted-foreground">
          {s.perWeek.map((w) => (
            <span key={w.weekStart} className="flex-1 text-center">
              {w.weekStart.slice(5)}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
