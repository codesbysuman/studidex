// app/subjects/[id]/page.tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    GraduationCap,
    Sliders,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { formatHumanDate, categorizeMaterials } from "@/lib/core";

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { state, setTopicProgress } = useStudidex();

    const subject = state.subjects.find((s) => s.id === id);
    if (!subject) {
        notFound();
    }

    const topics = state.topics.filter((t) => t.subjectId === subject.id);
    const materials = state.materials.filter((m) => m.subjectId === subject.id);
    const categorized = categorizeMaterials(materials);

    // Upcoming events for this subject
    const upcomingEvents = state.items.filter(
        (i) => i.subjectId === subject.id && i.type === "event" && i.startAt
    );
    upcomingEvents.sort(
        (a, b) => new Date(a.startAt || 0).getTime() - new Date(b.startAt || 0).getTime()
    );

    // Nearest exam / test
    const nextExam = upcomingEvents.find((e) => e.eventType === "exam" || e.eventType === "test");

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-10">
                {/* Back navigation */}
                <div>
                    <Link
                        href="/materials"
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted hover:text-foreground"
                    >
                        <ArrowLeft size={14} />
                        <span>All Materials & Subjects</span>
                    </Link>
                </div>

                {/* Subject Header */}
                <header className="border-b border-border-subtle pb-6">
                    <div className="flex items-center gap-2">
                        <span className="rounded bg-surface-subtle px-2 py-0.5 font-mono text-[11px] font-medium text-foreground-muted">
                            {subject.code || "SUBJECT"}
                        </span>
                    </div>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                        {subject.name}
                    </h1>
                    {subject.description && (
                        <p className="mt-1.5 text-[14px] text-foreground-muted">
                            {subject.description}
                        </p>
                    )}
                </header>

                {/* NEXT EXAM BANNER (if scheduled) */}
                {nextExam && (
                    <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                Next Milestone
                            </span>
                            <h2 className="text-lg font-semibold text-foreground">
                                {nextExam.title}
                            </h2>
                            <p className="mt-0.5 text-[13px] text-foreground-muted">
                                {formatHumanDate(nextExam.startAt)}
                                {nextExam.metadata?.marks && ` · ${nextExam.metadata.marks} marks`}
                                {nextExam.metadata?.units && ` · ${nextExam.metadata.units}`}
                            </p>
                        </div>

                        <Link
                            href={`/prepare/${nextExam.id}`}
                            className="inline-flex items-center gap-1.5 self-start rounded-xl bg-inverse px-4 py-2 text-[12px] font-medium text-inverse-foreground hover:opacity-90 sm:self-auto"
                        >
                            <span>Open Preparation View</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                )}

                {/* SYLLABUS & TOPIC PROGRESS */}
                <section className="space-y-4">
                    <div className="flex items-baseline justify-between border-b border-border-subtle pb-2">
                        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                            Syllabus Units & Progress
                        </h2>
                        <span className="text-[11px] text-foreground-faint">
                            {topics.length} units tracked
                        </span>
                    </div>

                    <div className="space-y-3">
                        {topics.map((topic) => {
                            const pct = topic.progressPercent || 0;
                            return (
                                <div
                                    key={topic.id}
                                    className="rounded-xl border border-border-subtle bg-surface p-4"
                                >
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {topic.unit && (
                                                    <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                        {topic.unit}
                                                    </span>
                                                )}
                                                <h3 className="text-[14.5px] font-medium text-foreground">
                                                    {topic.name}
                                                </h3>
                                            </div>
                                            {topic.description && (
                                                <p className="mt-0.5 text-[12.5px] text-foreground-muted">
                                                    {topic.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                            <div className="flex items-center gap-1">
                                                {[20, 40, 60, 80, 100].map((stepVal) => (
                                                    <button
                                                        key={stepVal}
                                                        onClick={() => setTopicProgress(topic.id, stepVal)}
                                                        className={`h-2.5 w-4 rounded-xs transition-colors ${
                                                            pct >= stepVal
                                                                ? "bg-foreground"
                                                                : "bg-border-subtle hover:bg-border"
                                                        }`}
                                                        title={`Set to ${stepVal}%`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="w-9 font-mono text-right text-[12px] font-medium text-foreground">
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* MATERIALS CONTEXTUAL TO THIS SUBJECT */}
                <section className="space-y-6">
                    <div className="border-b border-border-subtle pb-2">
                        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                            Associated Learning Materials
                        </h2>
                    </div>

                    {/* Mock Tests & PYQs */}
                    {(categorized.mockTests.length > 0 || categorized.pyqs.length > 0) && (
                        <div className="space-y-3">
                            <h3 className="text-[13px] font-medium text-foreground">
                                Mock Tests & PYQs
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {categorized.mockTests.map((mt) => (
                                    <Link
                                        key={mt.id}
                                        href={`/materials/${mt.id}`}
                                        className="rounded-xl border border-border-subtle bg-surface p-4 hover:border-border"
                                    >
                                        <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            Mock Test
                                        </span>
                                        <h4 className="mt-1.5 text-[14px] font-medium text-foreground">
                                            {mt.title}
                                        </h4>
                                        <p className="mt-1 text-[12px] text-foreground-muted line-clamp-1">
                                            {mt.description}
                                        </p>
                                    </Link>
                                ))}
                                {categorized.pyqs.map((pyq) => (
                                    <Link
                                        key={pyq.id}
                                        href={`/materials/${pyq.id}`}
                                        className="rounded-xl border border-border-subtle bg-surface p-4 hover:border-border"
                                    >
                                        <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            Past Papers
                                        </span>
                                        <h4 className="mt-1.5 text-[14px] font-medium text-foreground">
                                            {pyq.title}
                                        </h4>
                                        <p className="mt-1 text-[12px] text-foreground-muted line-clamp-1">
                                            {pyq.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes & Handouts */}
                    <div className="space-y-3">
                        <h3 className="text-[13px] font-medium text-foreground">
                            Notes, Handouts & Blueprint
                        </h3>
                        <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
                            {[...categorized.yourNotes, ...categorized.ourNotes, ...categorized.syllabus].map((m) => (
                                <Link
                                    key={m.id}
                                    href={`/materials/${m.id}`}
                                    className="flex items-center justify-between p-4 transition-colors hover:bg-surface-subtle/40"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                {m.origin} · {m.type}
                                            </span>
                                            <h4 className="text-[14px] font-medium text-foreground">
                                                {m.title}
                                            </h4>
                                        </div>
                                        {m.description && (
                                            <p className="mt-0.5 text-[12px] text-foreground-muted">
                                                {m.description}
                                            </p>
                                        )}
                                    </div>
                                    <ArrowRight size={14} className="shrink-0 text-foreground-muted" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
