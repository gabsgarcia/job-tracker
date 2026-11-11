"use server";

import { createClient } from "@/lib/supabase/server";
import {
  extractJobPostingFromHtml,
  fromAshby,
  fromGreenhouse,
  fromLever,
  isSafePublicUrl,
  parseJobUrl,
  type JobDraft,
} from "@/lib/job-links";

const TIMEOUT_MS = 8000;
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; JobTracker/1.0)" };

const CANT_READ =
  "Couldn't read the job from this link. Fill in the form below by hand (support for any site with AI is coming).";

async function getJson(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Follows redirects by hand so every hop is checked against private addresses.
async function getPublicHtml(url: string): Promise<string> {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    if (!isSafePublicUrl(current)) throw new Error("Blocked address");
    const res = await fetch(current, {
      headers: { ...HEADERS, Accept: "text/html" },
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const next = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && next) {
      current = new URL(next, current).toString();
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
  throw new Error("Too many redirects");
}

/** Reads a job posting link and returns the data to pre-fill the new application form. */
export async function lookupJob(
  link: string,
): Promise<{ draft: JobDraft } | { error: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please log in again." };

  const source = parseJobUrl(link);
  if (!source) return { error: "Paste a full link, starting with https://" };
  const url = link.trim();

  try {
    let draft: JobDraft | null = null;
    switch (source.kind) {
      case "greenhouse":
        draft = fromGreenhouse(
          await getJson(
            `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.board)}/jobs/${encodeURIComponent(source.id)}`,
          ),
          source.board,
          url,
        );
        break;
      case "lever":
        draft = fromLever(
          await getJson(
            `https://api${source.eu ? ".eu" : ""}.lever.co/v0/postings/${encodeURIComponent(source.company)}/${encodeURIComponent(source.id)}`,
          ),
          source.company,
          url,
        );
        break;
      case "ashby":
        draft = fromAshby(
          await getJson(
            `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.org)}`,
          ),
          source.id,
          source.org,
          url,
        );
        break;
      case "page":
        draft = extractJobPostingFromHtml(await getPublicHtml(source.url), url);
        break;
    }
    return draft?.position ? { draft } : { error: CANT_READ };
  } catch {
    return { error: CANT_READ };
  }
}
