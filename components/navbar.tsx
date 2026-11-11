import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { PalettePicker } from "@/components/palette-picker";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";

const links = [
  { href: "/applications", label: "Applications" },
  { href: "/tasks", label: "Tasks" },
  { href: "/stats", label: "Stats" },
];

export function Navbar() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10">
      {/* Phones: brand + controls on the first row, links on a second row. Wider: one row. */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 text-sm sm:min-h-16">
        <Link href="/" className="whitespace-nowrap font-semibold text-primary">
          💼 Job Tracker
        </Link>
        <div className="order-last flex w-full gap-5 sm:order-none sm:w-auto sm:flex-1 sm:gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <PalettePicker />
          <ThemeSwitcher />
          <div className="ml-1 sm:ml-3">
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
