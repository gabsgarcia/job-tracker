import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATUSES, type Application } from "@/lib/types";

// Shared fields for the "new application" and "edit application" forms.
export function ApplicationFields({ app }: { app?: Application }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1">
        <Label htmlFor="company">Company *</Label>
        <Input id="company" name="company" required defaultValue={app?.company} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="position">Position *</Label>
        <Input id="position" name="position" required defaultValue={app?.position} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={app?.status ?? "applied"}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="application_date">Application date</Label>
        <Input
          id="application_date"
          name="application_date"
          type="date"
          required
          defaultValue={app?.application_date ?? today}
        />
      </div>
      <div className="grid gap-1 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={app?.notes ?? ""}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
