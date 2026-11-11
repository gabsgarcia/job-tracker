import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";

// Logged-in users go straight to their applications.
async function RedirectIfLoggedIn() {
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/applications");
  }
  return null;
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-5 text-center max-w-xl">
        <h1 className="text-4xl font-bold">Job Tracker</h1>
        <p className="text-muted-foreground">
          Keep track of your job applications and the tasks for each one. Your
          data is private: only you can see your applications.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/auth/sign-up">Create an account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
