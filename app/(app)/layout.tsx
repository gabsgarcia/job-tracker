import { Suspense } from "react";
import { Navbar } from "@/components/navbar";

// Layout for every logged-in page: navbar on top, content in the middle.
// The proxy (proxy.ts) already sends logged-out visitors to /auth/login.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navbar />
      <div className="flex-1 w-full max-w-5xl p-5 flex flex-col gap-8">
        {/* Pages read cookies (the session), so they render inside Suspense. */}
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          {children}
        </Suspense>
      </div>
    </main>
  );
}
