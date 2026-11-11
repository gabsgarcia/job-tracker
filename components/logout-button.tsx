"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Back to the home page; refresh so no logged-in data stays in the router cache.
    router.push("/");
    router.refresh();
  };

  return <Button onClick={logout}>Logout</Button>;
}
