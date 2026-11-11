// Pure functions for "Quick add from a link": recognize the job site from the URL,
// and turn each site's data into the same shape (a JobDraft). No network here:
// the fetching lives in app/(app)/applications/quick-add-actions.ts.

export type JobSource =
  | { kind: "greenhouse"; board: string; id: string }
  | { kind: "lever"; company: string; id: string; eu: boolean }
  | { kind: "ashby"; org: string; id: string }
  | { kind: "page"; url: string }; // any other site: read schema.org data from the HTML

export type JobDraft = {
  company: string;
  position: string;
  location: string | null;
  url: string;
};

export function parseJobUrl(input: string): JobSource | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  // boards.greenhouse.io/{board}/jobs/{id} or job-boards.greenhouse.io/{board}/jobs/{id}
  if (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io") {
    if (parts[0] === "embed") {
      const board = url.searchParams.get("for");
      const id = url.searchParams.get("token");
      if (board && id) return { kind: "greenhouse", board, id };
    } else if (parts[1] === "jobs" && parts[2]) {
      return { kind: "greenhouse", board: parts[0], id: parts[2] };
    }
  }

  // jobs.lever.co/{company}/{id}[/apply] (and jobs.eu.lever.co for the EU)
  if ((host === "jobs.lever.co" || host === "jobs.eu.lever.co") && parts.length >= 2) {
    return { kind: "lever", company: parts[0], id: parts[1], eu: host.includes(".eu.") };
  }

  // jobs.ashbyhq.com/{org}/{id}[/application]
  if (host === "jobs.ashbyhq.com" && parts.length >= 2) {
    return { kind: "ashby", org: parts[0], id: parts[1] };
  }

  return { kind: "page", url: url.toString() };
}

/**
 * Basic protection before the server fetches a link typed by a user: never
 * request our own machine or private networks (e.g. cloud metadata at 169.254.169.254).
 */
export function isSafePublicUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
  if (host.includes(":")) return false; // IPv6 literal: no reason for a job site to use one

  const ip = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ip) {
    const [a, b] = [Number(ip[1]), Number(ip[2])];
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
  }
  return true;
}

export function prettifySlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// ── API responses → JobDraft ────────────────────────────────────────────────

type GreenhouseJob = { title?: string; company_name?: string; location?: { name?: string } };

export function fromGreenhouse(job: GreenhouseJob, board: string, url: string): JobDraft {
  return {
    company: clean(job.company_name) || prettifySlug(board),
    position: clean(job.title),
    location: clean(job.location?.name) || null,
    url,
  };
}

type LeverJob = { text?: string; categories?: { location?: string } };

export function fromLever(job: LeverJob, company: string, url: string): JobDraft {
  return {
    company: prettifySlug(company),
    position: clean(job.text),
    location: clean(job.categories?.location) || null,
    url,
  };
}

type AshbyBoard = { jobs?: { id: string; title?: string; location?: string }[] };

export function fromAshby(board: AshbyBoard, id: string, org: string, url: string): JobDraft | null {
  const job = board.jobs?.find((j) => j.id === id);
  if (!job) return null;
  return {
    company: prettifySlug(org),
    position: clean(job.title),
    location: clean(job.location) || null,
    url,
  };
}

// ── Any page: schema.org JobPosting (the data Google for Jobs reads) ────────

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

type Node = Record<string, unknown>;

function* nodesOf(data: unknown): Generator<Node> {
  if (Array.isArray(data)) {
    for (const item of data) yield* nodesOf(item);
  } else if (data && typeof data === "object") {
    const node = data as Node;
    yield node;
    if (node["@graph"]) yield* nodesOf(node["@graph"]);
  }
}

function isJobPosting(node: Node): boolean {
  const type = node["@type"];
  return type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
}

function locationOf(node: Node): string | null {
  const places = [node.jobLocation].flat().filter(Boolean) as Node[];
  for (const place of places) {
    const address = (place.address ?? {}) as Node;
    const text = [address.addressLocality, address.addressRegion]
      .map(clean)
      .filter(Boolean)
      .join(", ");
    if (text) return text;
    const country = clean(address.addressCountry);
    if (country) return country;
  }
  return node.jobLocationType === "TELECOMMUTE" ? "Remote" : null;
}

export function extractJobPostingFromHtml(html: string, url: string): JobDraft | null {
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const [, raw] of scripts) {
    let data: unknown;
    try {
      const text = raw.trim();
      data = JSON.parse(text.startsWith("{&quot;") || text.startsWith("[&quot;") ? decodeEntities(text) : text);
    } catch {
      continue;
    }
    for (const node of nodesOf(data)) {
      if (!isJobPosting(node)) continue;
      const org = node.hiringOrganization;
      const company = clean(typeof org === "string" ? org : (org as Node | undefined)?.name);
      const position = clean(node.title);
      if (!position) continue;
      return { company, position, location: locationOf(node), url };
    }
  }
  return null;
}

// ── Helpers for the AI fallback ─────────────────────────────────────────────

/** A single link → "link"; anything else with content → "text" (a pasted job description). */
export function classifyQuickAddInput(input: string): "link" | "text" | "empty" {
  const value = input.trim();
  if (!value) return "empty";
  return /^https?:\/\/\S+$/i.test(value) ? "link" : "text";
}

/** Readable text of a web page, to send to the AI instead of raw HTML (much smaller). */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article|\/header|\/footer)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
