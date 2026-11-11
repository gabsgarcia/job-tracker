"use client";

import { useState, useTransition } from "react";
import { Link2, Loader2 } from "lucide-react";
import { ApplicationFields } from "@/components/application-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createApplication } from "@/app/(app)/applications/actions";
import { lookupJob } from "@/app/(app)/applications/quick-add-actions";
import type { JobDraft } from "@/lib/job-links";

// "New application" card: paste a job link to pre-fill the form (Quick add),
// review it, then save with the normal form. Nothing is saved automatically.
export function NewApplicationForm() {
  const [link, setLink] = useState("");
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleLookup(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await lookupJob(link);
      if ("error" in result) {
        setError(result.error);
      } else {
        setDraft(result.draft);
        setLink("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleLookup} className="flex flex-col gap-2">
        <label htmlFor="quick-add" className="text-sm font-medium">
          Quick add from a job link
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="quick-add"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://jobs.lever.co/… · Greenhouse · Ashby · Gupy"
              className="pl-9"
              required
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Fill form"}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {draft && (
          <p role="status" className="text-sm text-primary animate-in fade-in-0">
            Filled from the link. Review and click “Add application”.
          </p>
        )}
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or fill in by hand
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        action={async (formData) => {
          // Clear the draft so the form comes back empty after saving.
          setDraft(null);
          await createApplication(formData);
        }}
        className="flex flex-col gap-4"
      >
        {/* A new key remounts the fields so their default values take the draft. */}
        <ApplicationFields
          key={draft?.url ?? "empty"}
          app={
            draft
              ? {
                  company: draft.company,
                  position: draft.position,
                  status: "saved",
                  job_url: draft.url,
                  notes: draft.location ? `Location: ${draft.location}` : null,
                }
              : undefined
          }
        />
        <div>
          <Button type="submit">Add application</Button>
        </div>
      </form>
    </div>
  );
}
