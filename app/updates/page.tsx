// app/updates/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    Bell,
    Calendar,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Filter,
    Info,
    RefreshCw,
    Sparkles,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { formatHumanDate, AcademicItem } from "@/lib/core";

export default function UpdatesPage() {
    const { state } = useStudidex();
    const [activeFilter, setActiveFilter] = useState<"all" | "academic" | "opportunities" | "changes">("all");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Filter updates & opportunities
    const updates = state.items.filter((item) => {
        if (item.type !== "update" && item.type !== "opportunity") return false;

        if (activeFilter === "all") return true;
        if (activeFilter === "opportunities") return item.type === "opportunity";
        if (activeFilter === "changes") return item.updateType === "change" || item.metadata?.changeDiff;
        if (activeFilter === "academic") return item.type === "update" && item.updateType !== "change";
        return true;
    });

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-10">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Academic Bulletin & Revisions
                    </p>
                    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                                Updates
                            </h1>
                            <p className="mt-1 text-[14px] text-foreground-muted">
                                What’s new, rescheduled, or announced across your academic institutions.
                            </p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                            {[
                                { key: "all", label: "All" },
                                { key: "changes", label: "Changes" },
                                { key: "academic", label: "Academic" },
                                { key: "opportunities", label: "Opportunities" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveFilter(tab.key as any)}
                                    className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
                                        activeFilter === tab.key
                                            ? "bg-foreground text-surface"
                                            : "border border-border-subtle bg-surface text-foreground-muted hover:text-foreground"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Updates List */}
                <div className="space-y-4">
                    {updates.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-foreground-muted">
                            <p className="text-[14px]">No updates match this filter.</p>
                        </div>
                    ) : (
                        updates.map((update) => {
                            const isExpanded = expandedIds.has(update.id);
                            const provenance = update.inputId
                                ? state.inputs.find((inp) => inp.id === update.inputId)
                                : null;
                            const subject = state.subjects.find((s) => s.id === update.subjectId);
                            const changeDiff = update.metadata?.changeDiff as { from?: string; to?: string } | undefined;

                            return (
                                <motion.div
                                    key={update.id}
                                    layout
                                    className="rounded-xl border border-border-subtle bg-surface p-5 transition-all hover:border-border"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                    {update.type === "opportunity"
                                                        ? update.opportunityType || "Opportunity"
                                                        : update.updateType || "Update"}
                                                </span>

                                                {subject && (
                                                    <span className="text-[12px] font-medium text-foreground-muted">
                                                        {subject.name}
                                                    </span>
                                                )}

                                                <h3 className="text-[15px] font-medium text-foreground">
                                                    {update.title}
                                                </h3>
                                            </div>

                                            <p className="text-[13px] text-foreground-secondary leading-relaxed">
                                                {update.description}
                                            </p>

                                            {/* Schedule Change Diff */}
                                            {changeDiff && (
                                                <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-surface-subtle px-3 py-1.5 font-mono text-[12px] text-foreground">
                                                    <span className="line-through text-foreground-faint">
                                                        {changeDiff.from}
                                                    </span>
                                                    <span>→</span>
                                                    <span className="font-semibold text-foreground">
                                                        {changeDiff.to}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Opportunity Details */}
                                            {update.type === "opportunity" && (
                                                <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-foreground-muted">
                                                    {update.metadata?.amount && (
                                                        <span>
                                                            <strong className="text-foreground">Stipend:</strong>{" "}
                                                            {String(update.metadata.amount)}
                                                        </span>
                                                    )}
                                                    {update.dueAt && (
                                                        <span>
                                                            <strong className="text-foreground">Deadline:</strong>{" "}
                                                            {formatHumanDate(update.dueAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Toggle Provenance / Details button */}
                                        <button
                                            onClick={() => toggleExpand(update.id)}
                                            className="shrink-0 rounded-lg p-1.5 text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                                            title="View origin and source details"
                                        >
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>

                                    {/* Collapsible Provenance Details (Section 15) */}
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 border-t border-border-subtle pt-3.5 text-[12px]"
                                        >
                                            <p className="font-semibold uppercase tracking-wider text-foreground-muted text-[10.5px]">
                                                Input Provenance & Context
                                            </p>

                                            {provenance ? (
                                                <div className="mt-2 rounded-lg border border-border-subtle bg-background p-3 text-foreground-secondary">
                                                    <div className="flex items-center justify-between text-[11px] text-foreground-faint">
                                                        <span>Source: {provenance.source.name || provenance.source.type}</span>
                                                        <span>Received: {formatHumanDate(provenance.createdAt)}</span>
                                                    </div>
                                                    <p className="mt-1.5 font-sans italic">
                                                        &ldquo;{provenance.content}&rdquo;
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-foreground-muted italic">
                                                    Directly recorded by user or system update.
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}
