import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowRight,
  BarChart3,
  Columns3,
  ListChecks,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BoardPreview } from "@/components/board-preview";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { enterClass, staggerStyle } from "@/lib/stagger";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
import { hasEnvVars } from "@/lib/utils";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Tells Google what this page is (a free web app), in schema.org format.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

// Logged-in users go straight to their applications.
async function RedirectIfLoggedIn() {
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/applications");
  }
  return null;
}

const features = [
  {
    icon: Sparkles,
    title: "Quick add with AI",
    text: "Paste a job link or description. Company, role and location are filled in for you.",
  },
  {
    icon: Columns3,
    title: "Kanban board",
    text: "Drag applications from saved to offered and see your whole pipeline at a glance.",
  },
  {
    icon: ListChecks,
    title: "Tasks and follow-ups",
    text: "Attach to-dos with due dates to each application, so no next step slips.",
  },
  {
    icon: BarChart3,
    title: "Stats",
    text: "Interview rate, weekly activity and overdue tasks, updated as you go.",
  },
  {
    icon: Palette,
    title: "Make it yours",
    text: "Six color schemes in light and dark mode. Plus confetti when an offer lands.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Row Level Security in the database: only you can see your applications.",
  },
];

const steps = [
  { title: "Paste", text: "Drop in a job link from Greenhouse, Lever, Gupy, LinkedIn or any career page." },
  { title: "Review", text: "Check the filled-in form, adjust what you want and save." },
  { title: "Track", text: "Move it across the board, add tasks and watch your stats grow." },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden">
        {/* Soft glow in the current color scheme */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[36rem] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.22),transparent_65%)]"
        />
        <div className="relative mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-12 px-5 pb-20 pt-16 sm:pt-24 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur ${enterClass}`}
            >
              <Sparkles className="size-3.5 text-primary" />
              New: paste a job link, AI fills the form
            </span>
            <h1
              className={`text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl ${enterClass}`}
              style={staggerStyle(1, 80)}
            >
              Your job search,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                organized.
              </span>
            </h1>
            <p
              className={`max-w-md text-lg text-muted-foreground ${enterClass}`}
              style={staggerStyle(2, 80)}
            >
              Save every opening in seconds, move it across your board, and never miss a
              follow-up again.
            </p>
            <div
              className={`flex flex-wrap items-center justify-center gap-3 ${enterClass}`}
              style={staggerStyle(3, 80)}
            >
              <Button asChild size="lg" className="rounded-full">
                <Link href="/auth/sign-up">
                  Start tracking, it&apos;s free <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full">
                <Link href="/auth/login">I have an account</Link>
              </Button>
            </div>
          </div>

          <div className={`${enterClass} duration-700`} style={staggerStyle(2, 120)}>
            <BoardPreview />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="w-full max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Everything your job hunt needs
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
          One place for every application, instead of a spreadsheet and a dozen browser tabs.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="group rounded-2xl border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="w-full max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          From job post to tracked in 10 seconds
        </h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30">
                {i + 1}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="max-w-xs text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Final call to action ─────────────────────────────────────────── */}
      <section className="w-full max-w-5xl px-5 pb-20 pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary-foreground/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-primary-foreground/10"
          />
          <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">
            Your next offer deserves a plan.
          </h2>
          <p className="relative mx-auto mt-2 max-w-md opacity-90">
            Create your free account and add your first application in under a minute.
          </p>
          <Button asChild size="lg" variant="secondary" className="relative mt-6 rounded-full">
            <Link href="/auth/sign-up">
              Create my free account <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="w-full border-t py-8 text-center text-xs text-muted-foreground">
        Built during the Le Wagon AI Product Builder bootcamp ·{" "}
        <a
          href="https://github.com/gabsgarcia/job-tracker"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Source on GitHub
        </a>
      </footer>
    </main>
  );
}
