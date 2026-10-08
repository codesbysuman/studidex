// app/prepare/[id]/page.tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Circle,
    Clock,
    FileText,
    HelpCircle,
    MapPin,
    ShieldAlert,
    Sparkles,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { getPreparationDetail, formatHumanDate, formatTime } from "@/lib/core";

export default function PreparationViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { state, toggleAction } = useStudidex();

    const prep = getPreparationDetail(state, id);
    if (!prep) {
        notFound();
    }

    const {
        event,
        subject,
        topics,
        syllabusUnits,
        yourMaterials,
        ourMaterials,
        mockTests,
        pyqs,
        prepActions,
        relatedAssignments,
    } = prep;

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-10">
                {/* Back navigation */}
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted hover:text-foreground"
                    >
                        <ArrowLeft size={14} />
                        <span>Return to Command Center</span>
                    </Link>
                </div>

                {/* Hero Milestone Header */}
                <header className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                            Target Event · {event.eventType || "Examination"}
                        </span>
                        {subject && (
                            <Link
                                href={`/subjects/${subject.id}`}
                                className="text-[12px] font-medium text-foreground-muted hover:text-foreground hover:underline"
                            >
                                {subject.name}
                            </Link>
                        )}
                    </div>

                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                        Prepare for {event.title}
                    </h1>

                    {event.description && (
                        <p className="mt-2 text-[14px] text-foreground-muted">
                            {event.description}
                        </p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-border-subtle pt-4 text-[13px] text-foreground-secondary">
                        {event.startAt && (
                            <div className="flex items-center gap-2">
                                <Clock size={15} className="text-foreground-muted" />
                                <span className="font-medium text-foreground">
                                    {formatHumanDate(event.startAt)} · {formatTime(event.startAt)}
                                </span>
                            </div>
                        )}

                        {event.metadata?.room && (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={15} className="text-foreground-muted" />
                                <span>{String(event.metadata.room)}</span>
                            </div>
                        )}

                        {event.metadata?.marks && (
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground">Weightage:</span>
                                <span>{String(event.metadata.marks)} marks</span>
                            </div>
                        )}

                        {event.metadata?.units && (
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground">Coverage:</span>
                                <span>{String(event.metadata.units)}</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* SYLLABUS UNITS RELEVANT TO THIS TEST */}
                <section className="space-y-4">
                    <div className="border-b border-border-subtle pb-2">
                        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                            Syllabus Units in Scope
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {topics.length > 0 ? (
                            topics.map((top) => (
                                <div
                                    key={top.id}
                                    className="rounded-xl border border-border-subtle bg-surface p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            {top.unit || "Unit"}
                                        </span>
                                        <span className="font-mono text-[11px] text-foreground-faint">
                                            {top.progressPercent || 0}% covered
                                        </span>
                                    </div>
                                    <h3 className="mt-2 text-[14.5px] font-medium text-foreground">
                                        {top.name}
                                    </h3>
                                    {top.description && (
                                        <p className="mt-0.5 text-[12.5px] text-foreground-muted">
                                            {top.description}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-[13px] text-foreground-muted italic">
                                General syllabus coverage for {subject?.name || "this exam"}.
                            </p>
                        )}
                    </div>
                </section>

                {/* PREPARATION ACTIONS & DEADLINES */}
                {(prepActions.length > 0 || relatedAssignments.length > 0) && (
                    <section className="space-y-4">
                        <div className="border-b border-border-subtle pb-2">
                            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                                Preparation Tasks & Submissions
                            </h2>
                        </div>

                        <div className="space-y-2.5">
                            {[...prepActions, ...relatedAssignments].map((action) => (
                                <div
                                    key={action.id}
                                    className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleAction(action.id)}
                                            className="text-foreground-muted hover:text-foreground active:scale-95 transition-transform"
                                        >
                                            {action.status === "completed" ? (
                                                <CheckCircle2 size={19} className="text-foreground" />
                                            ) : (
                                                <Circle size={19} strokeWidth={1.8} />
                                            )}
                                        </button>
                                        <div>
                                            <h3
                                                className={`text-[14px] font-medium ${
                                                    action.status === "completed"
                                                        ? "line-through text-foreground-muted"
                                                        : "text-foreground"
                                                }`}
                                            >
                                                {action.title}
                                            </h3>
                                            {action.description && (
                                                <p className="text-[12px] text-foreground-muted">
                                                    {action.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {action.dueAt && (
                                        <span className="font-mono text-[11.5px] text-foreground-muted">
                                            Due {formatHumanDate(action.dueAt)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* MOCK TESTS & PYQS PRACTICE */}
                {(mockTests.length > 0 || pyqs.length > 0) && (
                    <section className="space-y-4">
                        <div className="border-b border-border-subtle pb-2">
                            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                                Test Readiness: Mocks & PYQs
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {mockTests.map((mt) => (
                                <div
                                    key={mt.id}
                                    className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs"
                                >
                                    <div>
                                        <span className="rounded bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface">
                                            Interactive Mock Test
                                        </span>
                                        <h3 className="mt-2 text-[15px] font-medium text-foreground">
                                            {mt.title}
                                        </h3>
                                        <p className="mt-1 text-[12.5px] text-foreground-muted">
                                            {mt.testData?.questions.length || 0} questions · {mt.testData?.durationMinutes} mins · {mt.testData?.totalMarks} marks
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between">
                                        <span className="text-[12px] text-foreground-muted">
                                            {mt.userProgress?.completed ? (
                                                <span className="text-foreground font-medium">
                                                    Last score: {mt.userProgress.lastAttemptScore} / {mt.userProgress.totalMarks}
                                                </span>
                                            ) : (
                                                "Not attempted yet"
                                            )}
                                        </span>
                                        <Link
                                            href={`/materials/${mt.id}`}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-inverse px-3 py-1.5 text-[12px] font-medium text-inverse-foreground hover:opacity-90"
                                        >
                                            <span>{mt.userProgress?.completed ? "Retry Test" : "Take Test"}</span>
                                            <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {pyqs.map((pyq) => (
                                <div
                                    key={pyq.id}
                                    className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-5"
                                >
                                    <div>
                                        <span className="rounded bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            PYQ Repository
                                        </span>
                                        <h3 className="mt-2 text-[15px] font-medium text-foreground">
                                            {pyq.title}
                                        </h3>
                                        <p className="mt-1 text-[12.5px] text-foreground-muted line-clamp-2">
                                            {pyq.description}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-end">
                                        <Link
                                            href={`/materials/${pyq.id}`}
                                            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground hover:underline"
                                        >
                                            <span>Review Questions</span>
                                            <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* YOUR NOTES & OFFICIAL HANDOUTS */}
                <section className="space-y-4">
                    <div className="border-b border-border-subtle pb-2">
                        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                            Study Notes & Reference Materials
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Your Material */}
                        <div className="rounded-xl border border-border-subtle bg-surface p-5">
                            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-foreground-muted">
                                Your Notes ({yourMaterials.length})
                            </h3>
                            <div className="mt-3 space-y-2.5">
                                {yourMaterials.length > 0 ? (
                                    yourMaterials.map((m) => (
                                        <Link
                                            key={m.id}
                                            href={`/materials/${m.id}`}
                                            className="block rounded-lg p-2.5 transition-colors hover:bg-surface-subtle"
                                        >
                                            <p className="text-[13.5px] font-medium text-foreground">
                                                {m.title}
                                            </p>
                                            <p className="mt-0.5 text-[12px] text-foreground-muted line-clamp-1">
                                                {m.description}
                                            </p>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-[12.5px] text-foreground-muted italic">
                                        No personal notes saved for this subject yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Our Material / College Handouts */}
                        <div className="rounded-xl border border-border-subtle bg-surface p-5">
                            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-foreground-muted">
                                College & Teacher Handouts ({ourMaterials.length})
                            </h3>
                            <div className="mt-3 space-y-2.5">
                                {ourMaterials.length > 0 ? (
                                    ourMaterials.map((m) => (
                                        <Link
                                            key={m.id}
                                            href={`/materials/${m.id}`}
                                            className="block rounded-lg p-2.5 transition-colors hover:bg-surface-subtle"
                                        >
                                            <p className="text-[13.5px] font-medium text-foreground">
                                                {m.title}
                                            </p>
                                            <p className="mt-0.5 text-[12px] text-foreground-muted line-clamp-1">
                                                {m.description}
                                            </p>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-[12.5px] text-foreground-muted italic">
                                        No institutional handouts attached.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
