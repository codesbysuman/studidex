// app/actions/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    Calendar,
    ArrowRight,
    CheckSquare,
    ListChecks,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { getActionsGrouped, formatHumanDate, AcademicItem } from "@/lib/core";

export default function ActionsPage() {
    const { state, toggleAction, modifyItem } = useStudidex();
    const grouped = getActionsGrouped(state);
    const [viewFilter, setViewFilter] = useState<"all" | "active" | "completed">("active");

    const toggleSubChecklist = (action: AcademicItem, checklistIndex: number) => {
        if (!action.metadata?.checklist) return;
        const currentList = [...(action.metadata.checklist as Array<{ id: string; text: string; done: boolean }>)];
        currentList[checklistIndex].done = !currentList[checklistIndex].done;
        modifyItem(action.id, {
            metadata: {
                ...action.metadata,
                checklist: currentList,
            },
        });
    };

    const renderActionRow = (action: AcademicItem) => {
        const subject = state.subjects.find((s) => s.id === action.subjectId);
        const preparesForEvent = state.items.find((i) => i.id === action.preparesForItemId);
        const checklist = action.metadata?.checklist as Array<{ id: string; text: string; done: boolean }> | undefined;

        return (
            <motion.div
                key={action.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="group rounded-xl border border-border-subtle bg-surface p-4 transition-all hover:border-border"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => toggleAction(action.id)}
                            className="mt-0.5 text-foreground-muted hover:text-foreground active:scale-95 transition-transform"
                            aria-label="Toggle action"
                        >
                            {action.status === "completed" ? (
                                <CheckCircle2 size={19} className="text-foreground" />
                            ) : (
                                <Circle size={19} strokeWidth={1.8} />
                            )}
                        </button>

                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3
                                    className={`text-[14.5px] font-medium ${
                                        action.status === "completed"
                                            ? "line-through text-foreground-muted"
                                            : "text-foreground"
                                    }`}
                                >
                                    {action.title}
                                </h3>

                                {action.priority === "urgent" && (
                                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                                        Urgent
                                    </span>
                                )}
                                {action.priority === "high" && (
                                    <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                        High
                                    </span>
                                )}
                            </div>

                            {action.description && (
                                <p className="text-[12.5px] text-foreground-muted">
                                    {action.description}
                                </p>
                            )}

                            {/* Connected context */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11.5px] text-foreground-faint">
                                {subject && (
                                    <Link
                                        href={`/subjects/${subject.id}`}
                                        className="font-medium text-foreground-muted hover:text-foreground hover:underline"
                                    >
                                        {subject.name}
                                    </Link>
                                )}

                                {preparesForEvent && (
                                    <Link
                                        href={`/prepare/${preparesForEvent.id}`}
                                        className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                                    >
                                        <span>Prepares for: {preparesForEvent.title}</span>
                                        <ArrowRight size={11} />
                                    </Link>
                                )}
                            </div>

                            {/* Optional Sub-Checklist */}
                            {checklist && checklist.length > 0 && (
                                <div className="mt-3 space-y-1.5 rounded-lg border border-border-subtle bg-background p-3 text-[12px]">
                                    <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-foreground-muted text-[10.5px]">
                                        <ListChecks size={13} />
                                        <span>Sub-tasks ({checklist.filter((c) => c.done).length}/{checklist.length})</span>
                                    </p>
                                    <div className="space-y-1 pt-1">
                                        {checklist.map((task, cIdx) => (
                                            <button
                                                key={task.id || cIdx}
                                                onClick={() => toggleSubChecklist(action, cIdx)}
                                                className="flex w-full items-center gap-2 text-left hover:text-foreground"
                                            >
                                                <span className={task.done ? "text-foreground line-through opacity-70" : "text-foreground"}>
                                                    {task.done ? "☑" : "☐"} {task.text}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Due Date Indicator */}
                    {action.dueAt && (
                        <div className="shrink-0 text-right text-[12px]">
                            <span className="font-mono text-foreground-muted">
                                {formatHumanDate(action.dueAt)}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-10">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Academic Execution Queue
                    </p>
                    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                                Actions
                            </h1>
                            <p className="mt-1 text-[14px] text-foreground-muted">
                                What you need to do, connected to your syllabus, exams, and materials.
                            </p>
                        </div>

                        {/* Filter tabs */}
                        <div className="flex items-center gap-1.5">
                            {[
                                { key: "active", label: `Active (${grouped.counts.totalPending})` },
                                { key: "completed", label: `Completed (${grouped.counts.completed})` },
                                { key: "all", label: "All" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setViewFilter(tab.key as any)}
                                    className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
                                        viewFilter === tab.key
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

                {/* Overdue Section */}
                {viewFilter !== "completed" && grouped.overdue.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                                Overdue · Action Required
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            <AnimatePresence>
                                {grouped.overdue.map(renderActionRow)}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {/* Do Today Section */}
                {viewFilter !== "completed" && grouped.doToday.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-foreground px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-surface">
                                Do Today
                            </span>
                            <span className="text-[12px] text-foreground-muted">
                                ({grouped.doToday.length} task{grouped.doToday.length > 1 ? "s" : ""})
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            <AnimatePresence>
                                {grouped.doToday.map(renderActionRow)}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {/* Upcoming Section */}
                {viewFilter !== "completed" && grouped.upcoming.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                Upcoming
                            </span>
                            <span className="text-[12px] text-foreground-muted">
                                ({grouped.upcoming.length})
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            <AnimatePresence>
                                {grouped.upcoming.map(renderActionRow)}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {/* Completed Section */}
                {(viewFilter === "completed" || viewFilter === "all") && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                Completed Archive
                            </span>
                            <span className="text-[12px] text-foreground-muted">
                                ({grouped.completed.length})
                            </span>
                        </div>

                        {grouped.completed.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-[13px] text-foreground-muted italic">
                                No completed tasks yet. Finish a task above to see it archived here.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                <AnimatePresence>
                                    {grouped.completed.map(renderActionRow)}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}
