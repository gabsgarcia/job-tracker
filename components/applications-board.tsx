"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { celebrate } from "@/lib/celebrate";
import { STATUSES, type Application, type Status } from "@/lib/types";
import { updateApplicationStatus } from "@/app/(app)/applications/actions";

// Kanban view: one column per status. Dragging a card to another column
// changes its status. The move shows instantly (optimistic) and is rolled
// back automatically if the server action fails.
export function ApplicationsBoard({ applications }: { applications: Application[] }) {
  const [optimistic, moveOptimistic] = useOptimistic(
    applications,
    (current, { id, status }: { id: string; status: Status }) =>
      current.map((app) => (app.id === id ? { ...app, status } : app)),
  );
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const sensors = useSensors(
    // A small distance lets a simple click still open the application.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // On touch, press and hold to drag so the page can still scroll.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const active = optimistic.find((app) => app.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setError(undefined);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const id = String(event.active.id);
    const status = event.over?.id as Status | undefined;
    const app = optimistic.find((a) => a.id === id);
    if (!app || !status || app.status === status) return;

    startTransition(async () => {
      moveOptimistic({ id, status });
      const result = await updateApplicationStatus(id, status);
      if (result.error) setError(result.error);
      else if (status === "offered") celebrate();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Flash error={error} />
      <DndContext
        id="applications-board"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              applications={optimistic.filter((app) => app.status === status)}
              activeId={activeId}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {active ? <CardBody app={active} lifted /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  applications,
  activeId,
}: {
  status: Status;
  applications: Application[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${status} column`}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-lg border bg-muted/40 p-2 transition-colors lg:w-auto ${
        isOver ? "border-primary bg-accent" : ""
      }`}
    >
      <header className="flex items-center justify-between px-1 py-1">
        <StatusBadge status={status} />
        <span className="text-xs text-muted-foreground">{applications.length}</span>
      </header>
      <ul className="flex min-h-24 flex-col gap-2">
        {applications.map((app) => (
          <DraggableCard key={app.id} app={app} hidden={app.id === activeId} />
        ))}
        {applications.length === 0 && (
          <li className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            Drop here
          </li>
        )}
      </ul>
    </section>
  );
}

function DraggableCard({ app, hidden }: { app: Application; hidden: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: app.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      // While dragging, the DragOverlay shows the card; keep a faded placeholder here.
      className={`animate-in fade-in-0 zoom-in-95 duration-200 ${hidden ? "opacity-30" : ""}`}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable application"
    >
      <CardBody app={app} />
    </li>
  );
}

function CardBody({ app, lifted = false }: { app: Application; lifted?: boolean }) {
  return (
    <div
      className={`group flex items-start gap-2 rounded-md border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md ${
        lifted ? "rotate-2 cursor-grabbing shadow-lg ring-2 ring-primary" : "cursor-grab"
      }`}
    >
      <div className="min-w-0 flex-1">
        <Link
          href={`/applications/${app.id}`}
          className="block truncate font-medium hover:underline"
        >
          {app.company}
        </Link>
        <div className="truncate text-muted-foreground">{app.position}</div>
        <div className="mt-1 text-xs text-muted-foreground">{app.application_date}</div>
      </div>
      <GripVertical
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground opacity-40 group-hover:opacity-100"
      />
    </div>
  );
}
