import { Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { enterClass, staggerStyle } from "@/lib/stagger";
import type { Status } from "@/lib/types";

// Static picture of the app for the home page hero: Quick add on top, Kanban below.
// Made with the real StatusBadge and theme colors, so it follows the color scheme.
const columns: { status: Status; cards: { company: string; position: string }[]; mobile?: boolean }[] = [
  {
    status: "saved",
    cards: [
      { company: "Airbnb", position: "Account Executive" },
      { company: "Hotmart", position: "Product Analyst" },
    ],
  },
  {
    status: "applied",
    cards: [
      { company: "Nubank", position: "Product Manager" },
      { company: "QuintoAndar", position: "Associate PM" },
    ],
    mobile: true,
  },
  {
    status: "interviewing",
    cards: [{ company: "iFood", position: "Associate PM" }],
    mobile: true,
  },
  { status: "offered", cards: [] },
];

export function BoardPreview() {
  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10"
    >
      {/* Window bar */}
      <div className="flex items-center gap-1.5 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-green-400/80" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          job-tracker · Applications
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4 text-left">
        {/* Quick add */}
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
          <Sparkles className="size-3.5 shrink-0 text-primary" />
          <span className="truncate text-muted-foreground">
            https://jobs.lever.co/picpay/product-manager
          </span>
          <span className="ml-auto shrink-0 rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground">
            Fill form
          </span>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {columns.map((column, i) => (
            <div
              key={column.status}
              className={`flex-col gap-2 rounded-lg bg-muted/60 p-2 ${column.mobile ? "flex" : "hidden sm:flex"} ${enterClass}`}
              style={staggerStyle(i + 2, 100)}
            >
              <div className="flex items-center justify-between">
                <StatusBadge status={column.status} />
                <span className="text-[10px] text-muted-foreground">
                  {column.status === "offered" ? 1 : column.cards.length}
                </span>
              </div>
              {column.cards.map((card) => (
                <MiniCard key={card.company} {...card} />
              ))}
              {column.status === "offered" && (
                <div className="animate-float rounded-md border-2 border-primary bg-card p-2 shadow-lg">
                  <div className="text-xs font-medium">PicPay 🎉</div>
                  <div className="truncate text-[10px] text-muted-foreground">Product Manager</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniCard({ company, position }: { company: string; position: string }) {
  return (
    <div className="rounded-md border bg-card p-2 shadow-sm">
      <div className="truncate text-xs font-medium">{company}</div>
      <div className="truncate text-[10px] text-muted-foreground">{position}</div>
    </div>
  );
}
