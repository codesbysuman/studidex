"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowRight,
    CheckCircle2,
    Circle,
    Clock,
    FileText,
    HelpCircle,
    MapPin,
    Sparkles,
    Calendar,
    BookOpen,
    AlertCircle,
    Award,
    ExternalLink,
    User,
    Edit3,
    GraduationCap,
    Building2,
    Layers,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { getSmartHomeData, formatTime, formatHumanDate } from "@/lib/core";

export default function HomePage() {
    const { state, toggleAction, updateProfile } = useStudidex();
    const data = getSmartHomeData(state);
    const profile = state.profile || { name: "Student", stage: "ug" };

    const hasTodayContent =
        data.todayClasses.length > 0 ||
        data.todayEvents.length > 0 ||
        data.dueTodayActions.length > 0 ||
        data.overdueActions.length > 0;

    const examiningBodyDisplay = profile.examiningBody || profile.board;

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-12">
                {/* Header Context / Welcome */}
                <header className="border-b border-border-subtle pb-6 space-y-4">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <span suppressHydrationWarning className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                                    {data.todayLabel}
                                </span>
                                <span className="inline-block h-1 w-1 rounded-full bg-foreground-muted" />
                                <span className="text-[11px] font-medium text-foreground-muted">
                                    Daily Overview
                                </span>
                            </div>

                            <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl">
                                Hello, {profile.name || "Student"} 👋
                            </h1>
                            <p className="mt-1.5 text-[14px] text-foreground-muted">
                                What matters to you right now, indexed and connected.
                            </p>
                        </div>

                        {/* Personalize Profile Link Button */}
                        {/* <Link
                            href="/profile"
                            className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-surface px-3.5 py-2 text-[12.5px] font-medium text-foreground shadow-xs hover:border-foreground hover:shadow-xs transition-all active:scale-98"
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-surface text-[10px] font-bold">
                                {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
                            </div>
                            <span>Academic Profile</span>
                            <Edit3 size={13} className="text-foreground-muted" />
                        </Link> */}
                    </div>

                    {/* Quick Academic Profile Summary Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px]">
                        {profile.stage && (
                            <span className="rounded-lg bg-surface-subtle px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                                {profile.stage.toUpperCase()}
                            </span>
                        )}

                        {profile.className && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-foreground">
                                <GraduationCap size={13} className="text-foreground-muted" />
                                <span>{profile.className}</span>
                            </span>
                        )}

                        {examiningBodyDisplay && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-foreground">
                                <span>{examiningBodyDisplay}</span>
                            </span>
                        )}

                        {(profile.specialization || (profile.stream && profile.stream !== "General Foundation")) && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-foreground">
                                <Layers size={13} className="text-foreground-muted" />
                                <span>
                                    {profile.specialization || profile.stream?.split("—")[0].trim()}
                                </span>
                            </span>
                        )}

                        {profile.medium && (
                            <span className="rounded-lg border border-border-subtle bg-surface px-2 py-1 text-foreground-muted">
                                {profile.medium} Med.
                            </span>
                        )}

                        {(profile.institutionName || profile.center) && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-foreground-muted">
                                <Building2 size={13} className="text-foreground-muted" />
                                <span>
                                    {profile.institutionName}
                                    {profile.center ? ` (${profile.center})` : ""}
                                </span>
                            </span>
                        )}

                        {profile.papers && profile.papers.length > 0 ? (
                            <Link
                                href="/profile"
                                className="inline-flex items-center gap-1 rounded-lg bg-inverse text-inverse-foreground px-2.5 py-1 text-[11.5px] font-medium hover:opacity-90 transition-opacity"
                            >
                                <BookOpen size={12} />
                                <span>{profile.papers.length} Papers</span>
                            </Link>
                        ) : profile.enrolledSubjectIds && profile.enrolledSubjectIds.length > 0 ? (
                            <Link
                                href="/profile"
                                className="inline-flex items-center gap-1 rounded-lg bg-surface-subtle px-2.5 py-1 text-[11.5px] font-medium text-foreground-muted hover:text-foreground transition-colors"
                            >
                                <BookOpen size={12} />
                                <span>{profile.enrolledSubjectIds.length} Subjects</span>
                            </Link>
                        ) : null}
                    </div>
                </header>

                {/* First-Time User Personalization Card */}
                {!profile.hasCompletedOnboarding && (
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs"
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                            <div className="space-y-1.5 max-w-xl">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-semibold text-surface">
                                        <Sparkles size={11} /> First-Time Setup
                                    </span>
                                    <span className="text-[12px] font-medium text-foreground-muted">
                                        Tailor Studidex to your studies
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                                    Personalize your academic workspace
                                </h3>
                                <p className="text-[13px] text-foreground-muted leading-relaxed">
                                    Configure your stage (School, HS, College UG / PG), examining board or university, and your active semester papers (Core, SEC, DSE) so your schedule, exams, and materials are completely tailored to you.
                                </p>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
                                <Link
                                    href="/profile"
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-medium text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all"
                                >
                                    <span>Personalize Profile</span>
                                    <ArrowRight size={14} />
                                </Link>
                                <button
                                    onClick={() => updateProfile({ hasCompletedOnboarding: true })}
                                    title="Dismiss setup"
                                    className="rounded-xl border border-border px-3 py-2.5 text-[12.5px] font-medium text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Overdue Alert if any */}
                {data.overdueActions.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:p-5"
                    >
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle size={16} />
                            <h2 className="text-[12px] font-semibold uppercase tracking-wider">
                                Attention Needed · Overdue
                            </h2>
                        </div>
                        <div className="mt-3 divide-y divide-red-500/10">
                            {data.overdueActions.map((action) => (
                                <div
                                    key={action.id}
                                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleAction(action.id)}
                                            className="text-foreground-muted hover:text-foreground"
                                            aria-label="Mark complete"
                                        >
                                            <Circle size={18} strokeWidth={1.8} />
                                        </button>
                                        <span className="text-[13.5px] font-medium text-foreground">
                                            {action.title}
                                        </span>
                                    </div>
                                    <span className="text-[12px] text-red-600 dark:text-red-400">
                                        Due {formatHumanDate(action.dueAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* 1. TODAY SECTION */}
                {hasTodayContent && (
                    <section className="space-y-4">
                        <div className="flex items-baseline justify-between border-b border-border-subtle pb-2">
                            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                                Today
                            </h2>
                            <span className="text-[11px] text-foreground-faint">
                                {data.todayClasses.length + data.todayEvents.length + data.dueTodayActions.length} scheduled
                            </span>
                        </div>

                        <div className="space-y-3">
                            {/* Today's Classes & Events */}
                            {data.todayClasses.map((item) => (
                                <div
                                    key={item.id}
                                    className="group flex flex-col justify-between gap-2 rounded-xl border border-border-subtle bg-surface p-4 transition-all hover:border-border sm:flex-row sm:items-center"
                                >
                                    <div className="flex items-start gap-3 sm:items-center">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-foreground">
                                            <BookOpen size={18} strokeWidth={1.8} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                    Class
                                                </span>
                                                <h3 className="text-[14.5px] font-medium text-foreground">
                                                    {item.title}
                                                </h3>
                                            </div>
                                            {item.description && (
                                                <p className="mt-0.5 text-[12.5px] text-foreground-muted">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-[12.5px] text-foreground-muted sm:text-right">
                                        {item.metadata?.room && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin size={13} />
                                                <span>{String(item.metadata.room)}</span>
                                            </span>
                                        )}
                                        {item.startAt && (
                                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                                <Clock size={13} />
                                                <span>
                                                    {formatTime(item.startAt)}
                                                    {item.endAt ? ` – ${formatTime(item.endAt)}` : ""}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Today's Due Actions */}
                            {data.dueTodayActions.map((action) => (
                                <div
                                    key={action.id}
                                    className="group flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-4 transition-all hover:border-border"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleAction(action.id)}
                                            className="text-foreground-muted hover:text-foreground transition-transform active:scale-95"
                                            aria-label="Toggle action completion"
                                        >
                                            {action.status === "completed" ? (
                                                <CheckCircle2 size={19} className="text-foreground" />
                                            ) : (
                                                <Circle size={19} strokeWidth={1.8} />
                                            )}
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                    Due Today
                                                </span>
                                                <h3
                                                    className={`text-[14.5px] font-medium ${
                                                        action.status === "completed"
                                                            ? "line-through text-foreground-muted"
                                                            : "text-foreground"
                                                    }`}
                                                >
                                                    {action.title}
                                                </h3>
                                            </div>
                                            {action.description && (
                                                <p className="mt-0.5 text-[12.5px] text-foreground-muted">
                                                    {action.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {action.metadata?.room && (
                                        <span className="hidden text-[12px] text-foreground-muted sm:inline">
                                            {String(action.metadata.room)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. NEXT SECTION */}
                {data.nextItems.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-baseline justify-between border-b border-border-subtle pb-2">
                            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                                Next
                            </h2>
                            <Link href="/plan" className="text-[12px] font-medium text-foreground-muted hover:text-foreground">
                                View Full Plan →
                            </Link>
                        </div>

                        <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface">
                            {data.nextItems.map((item) => {
                                const isAction = item.type === "action";
                                const dateObj = item.startAt || item.dueAt;
                                const isExamOrTest = item.eventType === "exam" || item.eventType === "test";

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-4 transition-colors hover:bg-surface-subtle/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isAction ? (
                                                <button
                                                    onClick={() => toggleAction(item.id)}
                                                    className="text-foreground-muted hover:text-foreground"
                                                    aria-label="Toggle action"
                                                >
                                                    <Circle size={18} strokeWidth={1.8} />
                                                </button>
                                            ) : (
                                                <Calendar size={18} className="shrink-0 text-foreground-muted" />
                                            )}

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-[14px] font-medium text-foreground">
                                                        {item.title}
                                                    </h3>
                                                    {item.metadata?.marks && (
                                                        <span className="text-[11px] text-foreground-faint">
                                                            · {String(item.metadata.marks)} marks
                                                        </span>
                                                    )}
                                                    {item.metadata?.units && (
                                                        <span className="text-[11px] text-foreground-faint">
                                                            · {String(item.metadata.units)}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className="text-[12px] text-foreground-muted line-clamp-1">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-right">
                                            <span className="text-[12px] font-medium text-foreground">
                                                {formatHumanDate(dateObj)}
                                            </span>

                                            {isExamOrTest && (
                                                <Link
                                                    href={`/prepare/${item.id}`}
                                                    className="hidden rounded-lg bg-inverse px-2.5 py-1 text-[11px] font-medium text-inverse-foreground sm:inline-block hover:opacity-90"
                                                >
                                                    Prepare →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* 3. PREPARE SECTION (Dynamic: only when test/exam is approaching) */}
                {data.prepareSection && (
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
                    >
                        <div className="flex flex-col justify-between gap-2 border-b border-border-subtle pb-4 sm:flex-row sm:items-center">
                            <div>
                                <span className="inline-block rounded bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                    Upcoming Exam · Prepare
                                </span>
                                <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">
                                    {data.prepareSection.event.title}
                                </h2>
                                <p className="mt-0.5 text-[13px] text-foreground-muted">
                                    {formatHumanDate(data.prepareSection.event.startAt)} ·{" "}
                                    {data.prepareSection.syllabusUnits.join(", ") || "Full Syllabus"}
                                    {data.prepareSection.event.metadata?.marks && ` · ${data.prepareSection.event.metadata.marks} marks`}
                                </p>
                            </div>

                            <Link
                                href={`/prepare/${data.prepareSection.event.id}`}
                                className="inline-flex items-center gap-1.5 self-start rounded-xl bg-inverse px-4 py-2 text-[12px] font-medium text-inverse-foreground hover:opacity-90 sm:self-center"
                            >
                                <span>Complete Prep View</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {/* Quick Prep Actions & Materials Row */}
                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* Mock Tests */}
                            <div className="rounded-xl border border-border-subtle bg-background p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                                        Mock Tests
                                    </h3>
                                    <span className="text-[11px] text-foreground-faint">
                                        {data.prepareSection.mockTests.length} available
                                    </span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {data.prepareSection.mockTests.length > 0 ? (
                                        data.prepareSection.mockTests.map((mt) => (
                                            <Link
                                                key={mt.id}
                                                href={`/materials/${mt.id}`}
                                                className="block rounded-lg p-2 transition-colors hover:bg-surface-subtle"
                                            >
                                                <p className="text-[13px] font-medium text-foreground line-clamp-1">
                                                    {mt.title}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-foreground-muted">
                                                    {mt.testData?.durationMinutes} mins · {mt.testData?.totalMarks} marks
                                                </p>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className="text-[12px] text-foreground-muted italic">No mock tests added yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* PYQs */}
                            <div className="rounded-xl border border-border-subtle bg-background p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                                        Past Papers / PYQs
                                    </h3>
                                    <span className="text-[11px] text-foreground-faint">
                                        {data.prepareSection.pyqs.length} archived
                                    </span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {data.prepareSection.pyqs.length > 0 ? (
                                        data.prepareSection.pyqs.map((pyq) => (
                                            <Link
                                                key={pyq.id}
                                                href={`/materials/${pyq.id}`}
                                                className="block rounded-lg p-2 transition-colors hover:bg-surface-subtle"
                                            >
                                                <p className="text-[13px] font-medium text-foreground line-clamp-1">
                                                    {pyq.title}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-foreground-muted">
                                                    Previous questions
                                                </p>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className="text-[12px] text-foreground-muted italic">No PYQ sets recorded.</p>
                                    )}
                                </div>
                            </div>

                            {/* Study Notes & Handouts */}
                            <div className="rounded-xl border border-border-subtle bg-background p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                                        Notes & Handouts
                                    </h3>
                                    <span className="text-[11px] text-foreground-faint">
                                        {data.prepareSection.materials.length} files
                                    </span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {data.prepareSection.materials.slice(0, 2).map((m) => (
                                        <Link
                                            key={m.id}
                                            href={`/materials/${m.id}`}
                                            className="block rounded-lg p-2 transition-colors hover:bg-surface-subtle"
                                        >
                                            <p className="text-[13px] font-medium text-foreground line-clamp-1">
                                                {m.title}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-foreground-muted capitalize">
                                                {m.origin} origin · {m.type}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* 4. NEW & IMPORTANT UPDATES */}
                {data.recentUpdates.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-baseline justify-between border-b border-border-subtle pb-2">
                            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                                New & Changed
                            </h2>
                            <Link href="/updates" className="text-[12px] font-medium text-foreground-muted hover:text-foreground">
                                All Updates →
                            </Link>
                        </div>

                        <div className="space-y-2.5">
                            {data.recentUpdates.map((update) => (
                                <div
                                    key={update.id}
                                    className="flex items-start justify-between rounded-xl border border-border-subtle bg-surface p-4"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                {update.updateType || "Notice"}
                                            </span>
                                            <h3 className="text-[14px] font-medium text-foreground">
                                                {update.title}
                                            </h3>
                                        </div>
                                        <p className="mt-1 text-[12.5px] text-foreground-muted">
                                            {update.description}
                                        </p>

                                        {update.metadata?.changeDiff && (
                                            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-surface-subtle px-2.5 py-1 text-[11.5px] font-mono text-foreground">
                                                <span className="line-through text-foreground-faint">
                                                    {(update.metadata.changeDiff as any).from}
                                                </span>
                                                <span>→</span>
                                                <span className="font-semibold text-foreground">
                                                    {(update.metadata.changeDiff as any).to}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. OPPORTUNITIES (Only when active) */}
                {data.opportunities.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-baseline justify-between border-b border-border-subtle pb-2">
                            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                                Academic Opportunities
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {data.opportunities.map((opp) => (
                                <div
                                    key={opp.id}
                                    className="rounded-xl border border-border-subtle bg-surface p-4"
                                >
                                    <div className="flex items-center gap-2 text-foreground-muted">
                                        <Award size={15} />
                                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                                            {opp.opportunityType || "Opportunity"}
                                        </span>
                                    </div>
                                    <h3 className="mt-2 text-[14.5px] font-medium text-foreground">
                                        {opp.title}
                                    </h3>
                                    <p className="mt-1 text-[12.5px] text-foreground-muted">
                                        {opp.description}
                                    </p>
                                    {opp.metadata?.amount && (
                                        <p className="mt-2 text-[12px] font-medium text-foreground">
                                            Benefit: {String(opp.metadata.amount)}
                                        </p>
                                    )}
                                    {opp.dueAt && (
                                        <p className="mt-1 text-[11px] text-foreground-faint">
                                            Apply by: {formatHumanDate(opp.dueAt)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}