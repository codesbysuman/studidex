// app/settings/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowLeft,
    Check,
    Copy,
    Download,
    RefreshCw,
    Sliders,
    Trash2,
    User,
    Edit3,
    GraduationCap,
    Building2,
    Layers,
    BookOpen,
    Cloud,
    ShieldCheck,
    HardDrive,
    Sun,
    LogIn,
    LogOut,
} from "lucide-react";
import { useStudidex, type AuthUser } from "@/lib/use-studidex";
import { type StudidexState } from "@/lib/core";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthModal } from "@/components/auth-modal";

export default function SettingsPage({
    initialUser,
    initialState,
    isDbConnected: initialDbConnected,
}: {
    initialUser?: AuthUser | null;
    initialState?: StudidexState | null;
    isDbConnected?: boolean;
} = {}) {
    const { state, clearAll, user, isAuthenticated, logout, syncWithCloud, isSyncing, isDbConnected } = useStudidex({
        user: initialUser,
        state: initialState,
        isDbConnected: initialDbConnected,
    });
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const profile = state.profile || { name: "" };

    const handleCopyBackup = () => {
        navigator.clipboard.writeText(JSON.stringify(state, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadBackup = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `studidex-backup-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        if (confirm("Clear all items and notes? This will give you a clean slate.")) {
            clearAll();
            setActionMessage("All local items cleared.");
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-3xl space-y-8">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Preferences & Data Management
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                        Settings
                    </h1>
                    <p className="mt-1.5 text-[14px] text-foreground-muted">
                        Manage your academic profile, offline storage, backups, and app preferences.
                    </p>
                </header>

                {actionMessage && (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-[13px] text-green-700 dark:text-green-300">
                        {actionMessage}
                    </div>
                )}

                {/* Academic Profile Section */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User size={17} className="text-foreground-muted" />
                            <h2 className="text-[15px] font-semibold text-foreground">
                                Your Academic Profile
                            </h2>
                        </div>

                        <Link
                            href="/profile"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-foreground transition-colors"
                        >
                            <Edit3 size={13} />
                            <span>Edit Full Profile</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-3.5 space-y-1">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">Student Name</span>
                            <p className="font-semibold text-foreground">{profile.name || "Student"}</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-3.5 space-y-1">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">Level & Board / University</span>
                            <p className="font-semibold text-foreground">
                                {profile.stage ? profile.stage.toUpperCase() + " · " : ""}{profile.className || "Semester 3"} · {profile.examiningBody || profile.board || "Not specified"}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-3.5 space-y-1">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">Specialization & Medium</span>
                            <p className="font-semibold text-foreground">
                                {profile.specialization || profile.stream || "General"} · {profile.medium || "English"} Med.
                            </p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-3.5 space-y-1">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">Enrolled Institution</span>
                            <p className="font-semibold text-foreground">
                                {profile.institutionName || "Not configured"}
                                {profile.center ? ` (${profile.center})` : ""}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Appearance & Theme */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sun size={17} className="text-foreground-muted" />
                            <h2 className="text-[15px] font-semibold text-foreground">
                                Appearance & Theme
                            </h2>
                        </div>
                        <span className="text-[11.5px] text-foreground-muted">
                            Auto-saved preference
                        </span>
                    </div>

                    <p className="text-[13px] text-foreground-muted leading-relaxed">
                        Choose your preferred appearance across light, dark, and system modes.
                    </p>

                    <div className="max-w-md pt-1">
                        <ThemeToggle variant="segmented" />
                    </div>
                </section>

                {/* Stored Study Library Stats */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen size={17} className="text-foreground-muted" />
                            <h2 className="text-[15px] font-semibold text-foreground">
                                Local Study Library
                            </h2>
                        </div>
                        <span className="text-[11.5px] text-foreground-muted">
                            Saved safely on this device
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.subjects.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Subjects / Papers</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.topics.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Syllabus Topics</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.items.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Tasks & Events</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.materials.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Study Materials</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3 col-span-2 sm:col-span-1">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.inputs.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Saved Sources</p>
                        </div>
                    </div>
                </section>

                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

                {/* Cloud Sync & Student Account */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Cloud size={17} className="text-foreground-muted" />
                            <h2 className="text-[15px] font-semibold text-foreground">
                                Cloud Sync & Student Account
                            </h2>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            {isAuthenticated ? "Cloud Synced" : "Saved Locally on Device"}
                        </span>
                    </div>

                    <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-4 space-y-3">
                        {isAuthenticated && user ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11.5px] uppercase tracking-wider font-semibold text-foreground-muted">
                                        Connected Student Account
                                    </p>
                                    <p className="text-[14px] font-semibold text-foreground">
                                        {user.name || "Student"} <span className="text-foreground-muted font-normal">({user.email})</span>
                                    </p>
                                    <p className="text-[12px] text-foreground-muted">
                                        {user.className ? `${user.className} · ` : ""}{user.institutionName || "Personal Space"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={syncWithCloud}
                                        disabled={isSyncing}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-[12.5px] font-medium text-foreground hover:bg-surface-subtle shadow-2xs transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                                        <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/5 transition-colors"
                                    >
                                        <LogOut size={13} />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-[13.5px] font-semibold text-foreground">
                                        Sync Across Your Devices
                                    </p>
                                    <p className="text-[12px] text-foreground-muted">
                                        Sign in or create an account to access your notes, assignments, and exam schedule across your phone, tablet, and laptop.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsAuthOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-[12.5px] font-semibold text-surface shadow-xs hover:opacity-90 transition-opacity"
                                >
                                    <LogIn size={14} />
                                    <span>Sign In or Register</span>
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Backups & Portability */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <h2 className="text-[15px] font-semibold text-foreground">
                        Export & Backups
                    </h2>
                    <p className="text-[13px] text-foreground-muted leading-relaxed">
                        Export your complete academic space as a single backup file anytime. Keep your files safe or transfer them between devices easily.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            onClick={handleCopyBackup}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-subtle"
                        >
                            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                            <span>{copied ? "Copied to Clipboard!" : "Copy Data to Clipboard"}</span>
                        </button>
                        <button
                            onClick={handleDownloadBackup}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-subtle"
                        >
                            <Download size={14} />
                            <span>Download Backup File</span>
                        </button>
                    </div>
                </section>

                {/* Reset & Maintenance */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[15px] font-semibold text-foreground">
                            Workspace Storage & Reset
                        </h2>
                        <span className="text-[12px] font-medium text-foreground-muted">
                            {state.subjects.length} courses · {state.items.length} items
                        </span>
                    </div>
                    <p className="text-[13px] text-foreground-muted leading-relaxed">
                        Clear all local items, subjects, and study materials to begin with a completely fresh workspace. Cloud database sync remains intact unless updated.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            onClick={handleClear}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/5 transition-colors"
                        >
                            <Trash2 size={14} />
                            <span>Reset Local Workspace to Clean Slate</span>
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
