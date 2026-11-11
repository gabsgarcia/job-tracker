"use client";

// File upload only exists in the browser, so this component is client code.
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { importApplications } from "@/app/(app)/applications/import-actions";
import { isDuplicate, parseCSVRow, validateRow, type ParsedRow } from "@/lib/csv-import";

type Existing = Pick<ParsedRow, "company" | "position" | "application_date">;
type Preview = {
  valid: ParsedRow[];
  skipped: { line: number; row: ParsedRow; reasons: string[] }[];
};

function buildPreview(rows: Record<string, string>[], existing: Existing[]): Preview {
  const valid: ParsedRow[] = [];
  const skipped: Preview["skipped"] = [];
  rows.forEach((raw, i) => {
    const row = parseCSVRow(raw);
    const reasons = validateRow(row);
    if (reasons.length === 0 && isDuplicate(row, [...existing, ...valid]))
      reasons.push("Duplicate (same company, position and date)");
    if (reasons.length > 0) skipped.push({ line: i + 2, row, reasons }); // +2: header is line 1
    else valid.push(row);
  });
  return { valid, skipped };
}

export function CsvImport({ existing }: { existing: Existing[] }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function handleFile(file: File | undefined) {
    setResult(null);
    setPreview(null);
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy", // also accepts ";" files: Papa Parse detects the delimiter
      complete: ({ data }) => setPreview(buildPreview(data, existing)),
      error: (err) => setResult({ ok: false, text: `Could not read the file: ${err.message}` }),
    });
  }

  async function confirm() {
    if (!preview) return;
    setBusy(true);
    const res = await importApplications(preview.valid);
    const skipped = preview.skipped.length + (res.ok ? res.skipped : 0);
    setResult(
      res.ok
        ? { ok: true, text: `${res.imported} imported, ${skipped} skipped.` }
        : { ok: false, text: `Import failed: ${res.error}` },
    );
    setPreview(null);
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="rounded-lg border p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Import from CSV</h2>
      <p className="text-sm text-muted-foreground">
        Columns: company, position, status, application_date (YYYY-MM-DD), notes. You will see a
        preview before anything is saved.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="text-sm"
      />

      {preview && (
        <div className="flex flex-col gap-3 text-sm">
          <p>
            <strong>{preview.valid.length}</strong> row(s) ready to import,{" "}
            <strong>{preview.skipped.length}</strong> will be skipped.
          </p>
          {preview.valid.length > 0 && (
            <ul className="rounded border divide-y">
              {preview.valid.map((r, i) => (
                <li key={i} className="px-3 py-1">
                  ✅ {r.company} · {r.position} · {r.status} · {r.application_date}
                </li>
              ))}
            </ul>
          )}
          {preview.skipped.length > 0 && (
            <ul className="rounded border divide-y border-red-200 dark:border-red-900">
              {preview.skipped.map((s) => (
                <li key={s.line} className="px-3 py-1">
                  ❌ Line {s.line} ({s.row.company || "no company"}): {s.reasons.join("; ")}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button onClick={confirm} disabled={busy || preview.valid.length === 0}>
              {busy ? "Importing…" : `Import ${preview.valid.length} application(s)`}
            </Button>
            <Button variant="outline" onClick={() => setPreview(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {result && (
        <p className={result.ok ? "text-sm text-green-700 dark:text-green-300" : "text-sm text-red-700 dark:text-red-300"}>
          {result.text}
        </p>
      )}
    </section>
  );
}
