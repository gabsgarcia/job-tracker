"use client";

// File upload only exists in the browser, so this component is client code.
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { importApplications, type ImportRow } from "@/app/(app)/applications/import-actions";

export function CsvImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleImport() {
    if (!file) return;
    setBusy(true);
    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: async ({ data }) => {
        const rows: ImportRow[] = data.map((r) => ({
          company: (r.company ?? "").trim(),
          position: (r.position ?? "").trim(),
          status: (r.status ?? "applied").trim().toLowerCase(),
          application_date: (r.application_date ?? "").trim(),
          notes: (r.notes ?? "").trim() || null,
        }));
        const res = await importApplications(rows);
        setResult(
          res.ok
            ? { ok: true, text: `Imported ${res.imported} application(s). Skipped ${res.skipped}.` }
            : { ok: false, text: `Import failed: ${res.error}` },
        );
        setBusy(false);
        router.refresh();
      },
      error: (err) => {
        setResult({ ok: false, text: `Could not read the file: ${err.message}` });
        setBusy(false);
      },
    });
  }

  return (
    <section className="rounded-lg border p-4 flex flex-col gap-3">
      <h2 className="font-semibold">Import from CSV</h2>
      <p className="text-sm text-muted-foreground">
        Columns: company, position, status, application_date (YYYY-MM-DD), notes.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <Button onClick={handleImport} disabled={!file || busy}>
          {busy ? "Importing…" : "Import"}
        </Button>
      </div>
      {result && (
        <p className={result.ok ? "text-sm text-green-700 dark:text-green-300" : "text-sm text-red-700 dark:text-red-300"}>
          {result.text}
        </p>
      )}
    </section>
  );
}
