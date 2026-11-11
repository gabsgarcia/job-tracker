import { describe, expect, it } from "vitest";
import {
  classifyQuickAddInput,
  extractJobPostingFromHtml,
  htmlToText,
  fromAshby,
  fromGreenhouse,
  fromLever,
  isSafePublicUrl,
  parseJobUrl,
  prettifySlug,
} from "./job-links";

describe("parseJobUrl", () => {
  it("recognizes Greenhouse links (old and new domains)", () => {
    expect(parseJobUrl("https://boards.greenhouse.io/airbnb/jobs/8365363")).toEqual({
      kind: "greenhouse",
      board: "airbnb",
      id: "8365363",
    });
    expect(parseJobUrl("https://job-boards.greenhouse.io/nubank/jobs/123?gh_src=x")).toEqual({
      kind: "greenhouse",
      board: "nubank",
      id: "123",
    });
  });

  it("recognizes Greenhouse embed links", () => {
    expect(
      parseJobUrl("https://boards.greenhouse.io/embed/job_app?for=stone&token=987"),
    ).toEqual({ kind: "greenhouse", board: "stone", id: "987" });
  });

  it("recognizes Lever links, with or without /apply, and the EU domain", () => {
    const id = "6ed76ce8-4156-4b60-b120-403538bd66cd";
    expect(parseJobUrl(`https://jobs.lever.co/palantir/${id}`)).toEqual({
      kind: "lever",
      company: "palantir",
      id,
      eu: false,
    });
    expect(parseJobUrl(`https://jobs.eu.lever.co/acme/${id}/apply`)).toEqual({
      kind: "lever",
      company: "acme",
      id,
      eu: true,
    });
  });

  it("recognizes Ashby links", () => {
    const id = "34413f8d-26bf-4bbc-8ade-eb309a0e2245";
    expect(parseJobUrl(`https://jobs.ashbyhq.com/ramp/${id}/application`)).toEqual({
      kind: "ashby",
      org: "ramp",
      id,
    });
  });

  it("treats any other http(s) link as a page to read", () => {
    const url = "https://grupoboticario.gupy.io/jobs/12807306";
    expect(parseJobUrl(url)).toEqual({ kind: "page", url });
  });

  it("trims spaces and returns null for things that are not http(s) links", () => {
    expect(parseJobUrl("  https://example.com/job  ")).toEqual({
      kind: "page",
      url: "https://example.com/job",
    });
    expect(parseJobUrl("not a link")).toBeNull();
    expect(parseJobUrl("ftp://example.com/job")).toBeNull();
    expect(parseJobUrl("")).toBeNull();
  });
});

describe("isSafePublicUrl", () => {
  it("accepts normal public sites", () => {
    expect(isSafePublicUrl("https://grupoboticario.gupy.io/jobs/1")).toBe(true);
  });

  it("refuses local and private network addresses", () => {
    for (const url of [
      "http://localhost:3000",
      "http://127.0.0.1",
      "http://10.0.0.5",
      "http://192.168.0.1",
      "http://172.16.3.4",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/",
      "http://0.0.0.0",
      "http://printer.local",
    ]) {
      expect(isSafePublicUrl(url), url).toBe(false);
    }
  });
});

describe("prettifySlug", () => {
  it("turns a URL slug into a company name", () => {
    expect(prettifySlug("mercado-livre")).toBe("Mercado Livre");
    expect(prettifySlug("palantir")).toBe("Palantir");
  });
});

describe("API responses → job draft", () => {
  it("reads a Greenhouse job", () => {
    expect(
      fromGreenhouse(
        { title: "Account Executive", company_name: "Airbnb", location: { name: "Barcelona, Spain" } },
        "airbnb",
        "https://boards.greenhouse.io/airbnb/jobs/1",
      ),
    ).toEqual({
      company: "Airbnb",
      position: "Account Executive",
      location: "Barcelona, Spain",
      url: "https://boards.greenhouse.io/airbnb/jobs/1",
    });
  });

  it("falls back to the board name when Greenhouse has no company name", () => {
    expect(fromGreenhouse({ title: "PM" }, "mercado-livre", "u").company).toBe("Mercado Livre");
  });

  it("reads a Lever job (company comes from the link)", () => {
    expect(
      fromLever(
        { text: " Product Manager ", categories: { location: "São Paulo" } },
        "nubank",
        "u",
      ),
    ).toEqual({ company: "Nubank", position: "Product Manager", location: "São Paulo", url: "u" });
  });

  it("finds the right job in an Ashby job board", () => {
    const board = {
      jobs: [
        { id: "a", title: "Other", location: "NY" },
        { id: "b", title: " Security Engineer ", location: "Remote" },
      ],
    };
    expect(fromAshby(board, "b", "ramp", "u")).toEqual({
      company: "Ramp",
      position: "Security Engineer",
      location: "Remote",
      url: "u",
    });
    expect(fromAshby(board, "missing", "ramp", "u")).toBeNull();
  });
});

describe("extractJobPostingFromHtml", () => {
  const jobPosting = {
    "@context": "http://schema.org",
    "@type": "JobPosting",
    title: "Analista de Produto",
    hiringOrganization: { "@type": "Organization", name: "Grupo Boticário" },
    jobLocation: { address: { addressLocality: "Curitiba", addressRegion: "PR" } },
  };

  it("reads schema.org JobPosting data from a page", () => {
    const html = `<html><head><script type="application/ld+json">${JSON.stringify(
      jobPosting,
    )}</script></head></html>`;
    expect(extractJobPostingFromHtml(html, "u")).toEqual({
      company: "Grupo Boticário",
      position: "Analista de Produto",
      location: "Curitiba, PR",
      url: "u",
    });
  });

  it("reads it even when the JSON is HTML-escaped (like Gupy does)", () => {
    const escaped = JSON.stringify(jobPosting).replace(/"/g, "&quot;");
    const html = `<script type="application/ld+json">${escaped}</script>`;
    expect(extractJobPostingFromHtml(html, "u")?.company).toBe("Grupo Boticário");
  });

  it("finds the JobPosting inside @graph or arrays, skipping other types", () => {
    const html = `
      <script type="application/ld+json">{"@type":"WebSite","name":"x"}</script>
      <script type='application/ld+json'>{"@graph":[{"@type":"Organization"},${JSON.stringify(
        jobPosting,
      )}]}</script>`;
    expect(extractJobPostingFromHtml(html, "u")?.position).toBe("Analista de Produto");
  });

  it("says Remote for remote jobs without a city", () => {
    const remote = { ...jobPosting, jobLocation: undefined, jobLocationType: "TELECOMMUTE" };
    const html = `<script type="application/ld+json">${JSON.stringify(remote)}</script>`;
    expect(extractJobPostingFromHtml(html, "u")?.location).toBe("Remote");
  });

  it("returns null when there is no JobPosting or the JSON is broken", () => {
    expect(extractJobPostingFromHtml("<html><title>Jobs</title></html>", "u")).toBeNull();
    expect(
      extractJobPostingFromHtml(`<script type="application/ld+json">{broken</script>`, "u"),
    ).toBeNull();
  });
});

describe("classifyQuickAddInput", () => {
  it("sees a single link as a link", () => {
    expect(classifyQuickAddInput("  https://jobs.lever.co/x/1 ")).toBe("link");
  });

  it("sees anything else as job description text", () => {
    expect(classifyQuickAddInput("Nubank is hiring a Product Manager in São Paulo")).toBe("text");
    // A description that contains a link is still text
    expect(classifyQuickAddInput("Apply at https://nubank.com.br/careers - PM role")).toBe("text");
  });

  it("returns empty for blank input", () => {
    expect(classifyQuickAddInput("   \n ")).toBe("empty");
  });
});

describe("htmlToText", () => {
  it("drops scripts, styles and tags and keeps readable text", () => {
    const html = `<html><head><style>p{color:red}</style><script>var x=1</script></head>
      <body><h1>Product Manager</h1><p>Join&nbsp;us at <b>Nubank</b> &amp; grow.</p></body></html>`;
    expect(htmlToText(html)).toBe("Product Manager\nJoin us at Nubank & grow.");
  });
});
