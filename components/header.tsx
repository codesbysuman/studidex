"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Cloud, RefreshCw, User } from "lucide-react";
import { StudidexLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useStudidex } from "@/lib/use-studidex";
import { AuthModal } from "./auth-modal";

export default function Header({ className = "" }: { className?: string }) {
  const { state, user, isAuthenticated, isSyncing, syncWithCloud } = useStudidex();
  const profile = state.profile || { name: "" };
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleSyncClick = () => {
    if (isAuthenticated) {
      syncWithCloud();
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-background/90 px-4 backdrop-blur-md md:hidden ${className}`}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[16px] font-semibold tracking-[-0.03em] text-foreground"
        >
          <StudidexLogo size={20} />
          <span>Studidex</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {/* Mobile Cloud Sync Button */}
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSyncing}
            aria-label={isAuthenticated ? "Sync with Cloud Database" : "Connect Cloud Database"}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11.5px] font-medium transition-all active:scale-95 ${isAuthenticated
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
              : "border-border-subtle bg-surface text-foreground-muted hover:text-foreground"
              }`}
          >
            {isSyncing ? (
              <RefreshCw size={13} className="animate-spin text-foreground" />
            ) : (
              <Cloud size={13} />
            )}
            <span className={!isSyncing && !isAuthenticated ? `hidden` : `font-semibold`}>
              {isSyncing ? "Syncing" : isAuthenticated ? "Synced" : null}
            </span>
            {isAuthenticated && !isSyncing && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
          </button>

          {/* 3-Theme Switcher (Dark / Light / System) */}
          <ThemeToggle variant="icon" />

          {/* Settings button */}
          <Link
            href="/settings"
            aria-label="Settings and Preferences"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-foreground-muted hover:border-foreground/30 hover:text-foreground active:scale-95 transition-all"
          >
            <Settings size={15} />
          </Link>

          {/* Profile Avatar */}
          <Link
            href="/profile"
            aria-label="View Academic Profile"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-surface text-[12px] font-bold shadow-xs active:scale-95 transition-transform"
          >
            {profile.name ? profile.name.charAt(0).toUpperCase() : <User size={13} />}
          </Link>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}