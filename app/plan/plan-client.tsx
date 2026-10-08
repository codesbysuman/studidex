// app/plan/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    ArrowRight,
    Award,
    Filter,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { getPlanAgenda, formatTime, formatHumanDate } from "@/lib/core";

export default function PlanPage() {
    const { state } = useStudidex();
    const agendaGroups = getPlanAgenda(state);
    const [filterType, setFilterType] = useState<"all" | "exam" | "class" | "deadline">("all");

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-10">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Chronological Academic Agenda
                    </p>
                    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                                Plan
                            </h1>
                            <p className="mt-1 text-[14px] text-foreground-muted">
                                What’s happening and when. Classes, exams, deadlines, and submissions.
                            </p>
                        </div>

                        {/* Filter pills */}
                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                            {[
                                { key: "all", label: "All" },
                                { key: "exam", label: "Tests & Exams" },
                                { key: "class", label: "Classes" },
                                { key: "deadline", label: "Deadlines" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilterType(tab.key as any)}
                                    className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
                                        filterType === tab.key
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

                {/* Agenda Date Groups */}
                <div className="space-y-8">
                    {agendaGroups.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-foreground-muted">
                            <p className="text-[14px]">No scheduled events found.</p>
                            <Link href="/add" className="mt-3 inline-block text-[13px] font-medium text-foreground underline">
                                Add or import items →
                            </Link>
                        </div>
                    ) : (
                        agendaGroups.map((group) => {
                            // Filter items inside this date
                            const filteredItems = group.items.filter((item) => {
                                if (filterType === "all") return true;
                                if (filterType === "exam") return item.eventType === "exam" || item.eventType === "test";
                                if (filterType === "class") return item.eventType === "class";
                                if (filterType === "deadline") return item.eventType === "deadline" || item.type === "action";
                                return true;
                            });

                            if (filteredItems.length === 0) return null;

                            return (
                                <div key={group.dateKey} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                                                group.isToday
                                                    ? "bg-foreground text-surface"
                                                    : "bg-surface-subtle text-foreground-muted"
                                            }`}
                                        >
                                            {group.humanLabel}
                                        </span>
                                        <div className="h-px flex-1 bg-border-subtle" />
                                    </div>

                                    <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface shadow-xs">
                                        {filteredItems.map((item) => {
                                            const subject = state.subjects.find((s) => s.id === item.subjectId);
                                            const isExamOrTest = item.eventType === "exam" || item.eventType === "test";

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-surface-subtle/40 sm:flex-row sm:items-center"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                                {item.eventType || item.actionType || item.type}
                                                            </span>

                                                            {subject && (
                                                                <Link
                                                                    href={`/subjects/${subject.id}`}
                                                                    className="text-[12px] font-medium text-foreground-muted hover:text-foreground hover:underline"
                                                                >
                                                                    {subject.name}
                                                                </Link>
                                                            )}

                                                            <h3 className="text-[14.5px] font-medium text-foreground">
                                                                {item.title}
                                                            </h3>
                                                        </div>

                                                        {item.description && (
                                                            <p className="text-[12.5px] text-foreground-muted">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                                        {item.metadata?.room && (
                                                            <span className="inline-flex items-center gap-1 text-[12px] text-foreground-muted">
                                                                <MapPin size={13} />
                                                                <span>{String(item.metadata.room)}</span>
                                                            </span>
                                                        )}

                                                        {item.startAt && (
                                                            <span className="inline-flex items-center gap-1 font-mono text-[12px] text-foreground">
                                                                <Clock size={13} />
                                                                <span>
                                                                    {formatTime(item.startAt)}
                                                                    {item.endAt ? ` – ${formatTime(item.endAt)}` : ""}
                                                                </span>
                                                            </span>
                                                        )}

                                                        {isExamOrTest && (
                                                            <Link
                                                                href={`/prepare/${item.id}`}
                                                                className="inline-flex items-center gap-1 rounded-lg bg-inverse px-3 py-1 text-[12px] font-medium text-inverse-foreground hover:opacity-90"
                                                            >
                                                                <span>Prepare</span>
                                                                <ArrowRight size={13} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}
