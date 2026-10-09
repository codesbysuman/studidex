"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { StudidexLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useStudidex } from "@/lib/use-studidex";

export default function Header({ className = "" }: { className?: string }) {
  const { state } = useStudidex();
  const profile = state.profile || { name: "Student" };

  return (
    <header
      className={`sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-background/90 px-5 backdrop-blur-md md:hidden ${className}`}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.03em] text-foreground"
      >
        <StudidexLogo size={22} />
        <span>Studidex</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* 3-Theme Switcher (Dark / Light / System) */}
        <ThemeToggle variant="icon" />

        {/* Settings button - fully accessible from mobile */}
        <Link
          href="/settings"
          aria-label="Settings and Preferences"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-foreground-muted hover:border-foreground/30 hover:text-foreground active:scale-95 transition-all"
        >
          <Settings size={16} />
        </Link>

        {/* Profile Avatar */}
        <Link
          href="/profile"
          aria-label="View and Personalize Academic Profile"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-surface text-[12px] font-bold shadow-xs active:scale-95 transition-transform"
        >
          {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
        </Link>
      </div>
    </header>
  );
}