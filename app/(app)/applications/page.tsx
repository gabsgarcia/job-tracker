import Link from "next/link";
import { Columns3, List } from "lucide-react";
import { ApplicationsBoard } from "@/components/applications-board";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { ApplicationFields } from "@/components/application-fields";
import { CsvImport } from "@/components/csv-import";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { enterClass, staggerStyle } from "@/lib/stagger";
import { STATUSES, type Application } from "@/lib/types";
import { createApplication } from "./actions";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; view?: string }>;
}) {
  const { message, error, view = "list" } = await searchParams;
  const supabase = await createClient();

  // RLS guarantees this only returns the logged-in user's rows.
  const { data, error: loadError } = await supabase
    .from("applications")
    .select("*")
    .order("application_date", { ascending: false });
  const applications = (data ?? []) as Application[];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Applications</h1>
      <Flash message={message} error={error ?? loadError?.message} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border p-4 flex flex-col gap-4 lg:col-span-2">
          <h2 className="font-semibold">New application</h2>
          <form action={createApplication} className="flex flex-col gap-4">
            <ApplicationFields />
            <div>
              <Button type="submit">Add application</Button>
            </div>
          </form>
        </section>

        {/* Shortcut to the list below. First on mobile, side card on desktop. */}
        <aside className="order-first flex flex-col gap-4 rounded-lg border bg-accent/50 p-4 lg:order-none">
          <h2 className="font-semibold">Your applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Add your first application or import a CSV.
            </p>
          ) : (
            <>
              <div>
                <div className="text-4xl font-bold tabular-nums text-primary">
                  {applications.length}
                </div>
                <div className="text-sm text-muted-foreground">applications tracked</div>
              </div>
              <ul className="flex flex-wrap gap-2">
                {STATUSES.map((status) => {
                  const count = applications.filter((a) => a.status === status).length;
                  if (count === 0) return null;
                  return (
                    <li key={status} className="flex items-center gap-1 text-sm">
                      <StatusBadge status={status} />
                      <span className="tabular-nums text-muted-foreground">{count}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <Button asChild>
                  <Link href="/applications?view=list#your-applications">
                    <List className="size-4" /> See all applications
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/applications?view=board#your-applications">
                    <Columns3 className="size-4" /> Open the board
                  </Link>
                </Button>
              </div>
            </>
          )}
        </aside>
      </div>

      <CsvImport
        existing={applications.map(({ company, position, application_date }) => ({
          company,
          position,
          application_date,
        }))}
      />

      <section id="your-applications" className="flex scroll-mt-4 flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Your applications ({applications.length})</h2>
          <nav aria-label="View" className="flex rounded-md border p-0.5 text-sm">
            {(["list", "board"] as const).map((v) => (
              <Link
                key={v}
                href={`/applications?view=${v}#your-applications`}
                aria-current={view === v ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 capitalize ${
                  view === v ? "bg-accent font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "list" ? <List className="size-4" /> : <Columns3 className="size-4" />}
                {v}
              </Link>
            ))}
          </nav>
        </div>
        {applications.length === 0 ? (
          <p className="text-muted-foreground">No applications yet. Add your first one above.</p>
        ) : view === "board" ? (
          <ApplicationsBoard applications={applications} />
        ) : (
          <ul className="divide-y rounded-lg border">
            {applications.map((app, i) => (
              <li key={app.id} className={enterClass} style={staggerStyle(i)}>
                <Link
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between gap-4 p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{app.company}</div>
                    <div className="text-sm text-muted-foreground">{app.position}</div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{app.application_date}</span>
                    <StatusBadge status={app.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
