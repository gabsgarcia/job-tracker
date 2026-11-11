"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { MAX_AI_CHARS, aiEnabled, extractJobWithAI } from "@/lib/ai-extract-job";
import {
  classifyQuickAddInput,
  extractJobPostingFromHtml,
  fromAshby,
  fromGreenhouse,
  fromLever,
  htmlToText,
  isSafePublicUrl,
  parseJobUrl,
  type JobDraft,
} from "@/lib/job-links";

const TIMEOUT_MS = 8000;
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; JobTracker/1.0)" };

const CANT_READ = aiEnabled()
  ? "Couldn't find a job posting here. Fill in the form below by hand."
  : "Couldn't read the job from this link. Paste the job description instead, or fill in the form by hand.";
const CANT_OPEN =
  "This site doesn't let us open the page (LinkedIn, for example, needs a login). Copy the job description and paste it here instead.";
const NO_AI =
  "Reading pasted text needs AI, which isn't set up yet (ANTHROPIC_API_KEY). Paste a job link or fill in the form by hand.";
const AI_FAILED = "The AI couldn't read this right now. Try again in a moment, or fill in the form by hand.";
const TOO_LONG = "This text is too long to be a single job posting. Paste only the job description.";

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

async function readWithAI(content: string, url: string): Promise<{ draft: JobDraft } | { error: string }> {
  if (!aiEnabled()) return { error: NO_AI };
  if (content.length > MAX_AI_CHARS) return { error: TOO_LONG };
  try {
    const draft = await extractJobWithAI(content, url);
    return draft ? { draft } : { error: CANT_READ };
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.error("Quick add AI error:", error.status, error.message);
    return { error: AI_FAILED };
  }
}

async function readLink(link: string): Promise<{ draft: JobDraft } | { error: string }> {
  const source = parseJobUrl(link);
  if (!source) return { error: "Paste a full link, starting with https://" };
  const url = link.trim();

  // Job boards with a public API: exact data, no AI needed.
  try {
    let draft: JobDraft | null = null;
    if (source.kind === "greenhouse") {
      draft = fromGreenhouse(
        await getJson(
          `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.board)}/jobs/${encodeURIComponent(source.id)}`,
        ),
        source.board,
        url,
      );
    } else if (source.kind === "lever") {
      draft = fromLever(
        await getJson(
          `https://api${source.eu ? ".eu" : ""}.lever.co/v0/postings/${encodeURIComponent(source.company)}/${encodeURIComponent(source.id)}`,
        ),
        source.company,
        url,
      );
    } else if (source.kind === "ashby") {
      draft = fromAshby(
        await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.org)}`),
        source.id,
        source.org,
        url,
      );
    }
    if (source.kind !== "page") return draft?.position ? { draft } : { error: CANT_READ };
  } catch {
    return { error: CANT_READ };
  }

  // Any other site: schema.org data first (free and exact), then the AI reads the page text.
  let html: string;
  try {
    html = await getPublicHtml(source.url);
  } catch {
    return { error: CANT_OPEN };
  }
  const draft = extractJobPostingFromHtml(html, url);
  if (draft?.position) return { draft };
  return readWithAI(htmlToText(html), url);
}

/**
 * Quick add: takes a job link or a pasted job description and returns the data
 * to pre-fill the new application form. Nothing is saved here.
 */
export async function lookupJob(input: string): Promise<{ draft: JobDraft } | { error: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please log in again." };

  switch (classifyQuickAddInput(input)) {
    case "empty":
      return { error: "Paste a job link or the job description first." };
    case "link":
      return readLink(input);
    case "text":
      return readWithAI(input.trim(), "");
  }
}
