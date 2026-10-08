// app/settings/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowLeft,
    Check,
    Copy,
    Database,
    Download,
    RefreshCw,
    Sliders,
    Trash2,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";

export default function SettingsPage() {
    const { state, resetSample, clearAll } = useStudidex();
    const [copied, setCopied] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

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

    const handleReset = () => {
        if (confirm("Reset Studidex back to default academic demonstration dataset?")) {
            resetSample();
            setActionMessage("Reset to demo dataset successfully.");
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    const handleClear = () => {
        if (confirm("Clear all data in Studidex? This will erase all local items.")) {
            clearAll();
            setActionMessage("Cleared all local data.");
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-3xl space-y-8">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        System Configuration
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                        Settings & State
                    </h1>
                    <p className="mt-1.5 text-[14px] text-foreground-muted">
                        Manage your local academic index, backups, and reset scenarios.
                    </p>
                </header>

                {actionMessage && (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-[13px] text-green-700 dark:text-green-300">
                        {actionMessage}
                    </div>
                )}

                {/* State Metrics */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Database size={17} className="text-foreground-muted" />
                        <h2 className="text-[15px] font-semibold text-foreground">
                            Unified Academic Model Store
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.subjects.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Subjects</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.topics.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Topics</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.items.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Academic Items</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.materials.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Materials</p>
                        </div>
                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3 col-span-2 sm:col-span-1">
                            <span className="font-mono text-xl font-bold text-foreground">
                                {state.inputs.length}
                            </span>
                            <p className="text-[11px] text-foreground-muted">Inputs</p>
                        </div>
                    </div>
                </section>

                {/* Backup & Export */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <h2 className="text-[15px] font-semibold text-foreground">
                        Data Export & Backup
                    </h2>
                    <p className="text-[13px] text-foreground-muted leading-relaxed">
                        Export your full Studidex canonical state as JSON. In future versions, this same JSON schema connects to our sync server and mobile apps.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            onClick={handleCopyBackup}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-subtle"
                        >
                            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                            <span>{copied ? "Copied JSON!" : "Copy State JSON"}</span>
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
                    <h2 className="text-[15px] font-semibold text-foreground">
                        Testing & Reset
                    </h2>
                    <p className="text-[13px] text-foreground-muted leading-relaxed">
                        Reset back to the pristine academic scenario with upcoming Political Science exams, due Economics assignments, and mock test preparation.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 rounded-xl bg-inverse px-4 py-2 text-[13px] font-medium text-inverse-foreground hover:opacity-90"
                        >
                            <RefreshCw size={14} />
                            <span>Reset to Demo Dataset</span>
                        </button>

                        <button
                            onClick={handleClear}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/5"
                        >
                            <Trash2 size={14} />
                            <span>Clear All Local Data</span>
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
