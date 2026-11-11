"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ApplicationFields } from "@/components/application-fields";
import { Button } from "@/components/ui/button";
import { createApplication } from "@/app/(app)/applications/actions";
import { lookupJob } from "@/app/(app)/applications/quick-add-actions";
import type { JobDraft } from "@/lib/job-links";

// "New application" card: paste a job link or a job description to pre-fill the
// form (Quick add), review it, then save with the normal form. Nothing is saved automatically.
export function NewApplicationForm() {
  const [link, setLink] = useState("");
  const [draft, setDraft] = useState<JobDraft | null>(null);
  // Bumped on every new draft so the fields remount with the new default values.
  const [version, setVersion] = useState(0);
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
        setVersion((v) => v + 1);
        setLink("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleLookup} className="flex flex-col gap-2">
        <label htmlFor="quick-add" className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          Quick add: paste a job link or the job description
        </label>
        <textarea
          id="quick-add"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            // Enter submits (handy for links); Shift+Enter adds a new line.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={"https://… (Greenhouse, Lever, Ashby, Gupy, career pages, …)\nor paste the full job description, e.g. copied from LinkedIn"}
          rows={link.includes("\n") ? 5 : 2}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          required
        />
        <div>
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Reading…
              </>
            ) : (
              "Fill form"
            )}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {draft && (
          <p role="status" className="text-sm text-primary animate-in fade-in-0">
            Form filled. Review it and click “Add application”.
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
          setVersion((v) => v + 1);
          await createApplication(formData);
        }}
        className="flex flex-col gap-4"
      >
        {/* A new key remounts the fields so their default values take the draft. */}
        <ApplicationFields
          key={version}
          app={
            draft
              ? {
                  company: draft.company,
                  position: draft.position,
                  status: "saved",
                  job_url: draft.url || null,
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
