// app/materials/[id]/page.tsx
"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    Award,
    Check,
    CheckCircle2,
    Clock,
    FileText,
    HelpCircle,
    RefreshCw,
    RotateCcw,
    Sparkles,
    XCircle,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { MockTestAttempt, formatHumanDate } from "@/lib/core";

export default function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { state, saveTestAttempt } = useStudidex();

    const material = state.materials.find((m) => m.id === id);
    if (!material) {
        notFound();
    }

    const subject = state.subjects.find((s) => s.id === material.subjectId);
    const isMockTest = material.type === "mock_test" && Boolean(material.testData);

    // Mock Test Runner State
    const [testMode, setTestMode] = useState<"intro" | "taking" | "review">("intro");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
    const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(
        (material.testData?.durationMinutes || 20) * 60
    );

    // Countdown timer
    useEffect(() => {
        if (testMode !== "taking") return;
        const interval = setInterval(() => {
            setTimeRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmitTest();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [testMode]);

    const handleSelectOption = (questionId: string, optionIndex: number) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex,
        }));
    };

    const handleSubmitTest = () => {
        if (!material.testData) return;
        const questions = material.testData.questions;
        let score = 0;

        questions.forEach((q) => {
            if (selectedAnswers[q.id] === q.correctAnswerIndex) {
                score += q.marks;
            }
        });

        const attempt: MockTestAttempt = {
            id: `att_${Date.now()}`,
            timestamp: new Date().toISOString(),
            score,
            totalMarks: material.testData.totalMarks,
            selectedAnswers: { ...selectedAnswers },
            timeSpentSeconds: (material.testData.durationMinutes * 60) - timeRemainingSeconds,
        };

        saveTestAttempt(material.id, attempt);
        setTestMode("review");
    };

    const handleRestartTest = () => {
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setTimeRemainingSeconds((material.testData?.durationMinutes || 20) * 60);
        setTestMode("taking");
    };

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-3xl space-y-8">
                {/* Back navigation */}
                <div>
                    <Link
                        href="/materials"
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground-muted hover:text-foreground"
                    >
                        <ArrowLeft size={14} />
                        <span>Materials Catalog</span>
                    </Link>
                </div>

                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                            {material.origin} · {material.type}
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

                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
                        {material.title}
                    </h1>

                    {material.description && (
                        <p className="mt-1.5 text-[14px] text-foreground-muted">
                            {material.description}
                        </p>
                    )}
                </header>

                {/* ==================================================== */}
                {/* 1. MOCK TEST EXPERIENCE                              */}
                {/* ==================================================== */}
                {isMockTest && material.testData && (
                    <div className="space-y-6">
                        {/* INTRO SCREEN */}
                        {testMode === "intro" && (
                            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-semibold text-foreground">
                                        Mock Assessment Blueprint
                                    </h2>
                                    <p className="text-[13.5px] text-foreground-muted">
                                        Simulate authentic exam conditions with instant grading, solution explanations, and attempt archives.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-y border-border-subtle py-4 text-center">
                                    <div>
                                        <span className="font-mono text-xl font-bold text-foreground">
                                            {material.testData.questions.length}
                                        </span>
                                        <p className="text-[11px] text-foreground-muted">Questions</p>
                                    </div>
                                    <div>
                                        <span className="font-mono text-xl font-bold text-foreground">
                                            {material.testData.totalMarks}
                                        </span>
                                        <p className="text-[11px] text-foreground-muted">Total Marks</p>
                                    </div>
                                    <div>
                                        <span className="font-mono text-xl font-bold text-foreground">
                                            {material.testData.durationMinutes}m
                                        </span>
                                        <p className="text-[11px] text-foreground-muted">Duration</p>
                                    </div>
                                    <div>
                                        <span className="font-mono text-xl font-bold text-foreground">
                                            {material.userProgress?.attempts?.length || 0}
                                        </span>
                                        <p className="text-[11px] text-foreground-muted">Attempts</p>
                                    </div>
                                </div>

                                {material.userProgress?.lastAttemptScore !== undefined && (
                                    <div className="rounded-xl border border-border-subtle bg-surface-subtle/50 p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                Previous Score
                                            </p>
                                            <p className="text-[15px] font-semibold text-foreground">
                                                {material.userProgress.lastAttemptScore} / {material.userProgress.totalMarks} marks
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setTestMode("review")}
                                            className="text-[12px] font-medium text-foreground underline"
                                        >
                                            View previous review
                                        </button>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleRestartTest}
                                        className="inline-flex items-center gap-2 rounded-xl bg-inverse px-6 py-2.5 text-[13px] font-medium text-inverse-foreground hover:opacity-90"
                                    >
                                        <span>Start Timed Test</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAKING SCREEN */}
                        {testMode === "taking" && (
                            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-6">
                                {/* Top status bar */}
                                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                                    <div className="flex items-center gap-2 text-[12px] font-medium text-foreground-muted">
                                        <span>
                                            Question {currentQuestionIndex + 1} of {material.testData.questions.length}
                                        </span>
                                        <span>·</span>
                                        <span>{material.testData.questions[currentQuestionIndex].marks} marks</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 font-mono text-[13px] font-semibold text-foreground">
                                        <Clock size={15} />
                                        <span>{formatTimer(timeRemainingSeconds)}</span>
                                    </div>
                                </div>

                                {/* Active Question */}
                                {(() => {
                                    const q = material.testData.questions[currentQuestionIndex];
                                    const selectedOpt = selectedAnswers[q.id];

                                    return (
                                        <div className="space-y-5">
                                            <h3 className="text-lg font-medium leading-relaxed text-foreground">
                                                {q.question}
                                            </h3>

                                            <div className="space-y-2.5">
                                                {q.options.map((opt, optIdx) => {
                                                    const isSelected = selectedOpt === optIdx;
                                                    return (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => handleSelectOption(q.id, optIdx)}
                                                            className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                                                                isSelected
                                                                    ? "border-foreground bg-foreground/5 text-foreground"
                                                                    : "border-border-subtle bg-background text-foreground-secondary hover:border-border"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                                                                    isSelected
                                                                        ? "border-foreground bg-foreground text-surface"
                                                                        : "border-border-subtle bg-surface text-foreground-muted"
                                                                }`}
                                                            >
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </span>
                                                            <span className="text-[13.5px] leading-relaxed">
                                                                {opt}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Bottom navigation */}
                                <div className="flex items-center justify-between border-t border-border-subtle pt-5">
                                    <button
                                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className="rounded-xl border border-border px-4 py-2 text-[12px] font-medium text-foreground disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    {currentQuestionIndex < material.testData.questions.length - 1 ? (
                                        <button
                                            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                                            className="rounded-xl bg-inverse px-5 py-2 text-[12px] font-medium text-inverse-foreground hover:opacity-90"
                                        >
                                            Next Question
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmitTest}
                                            className="rounded-xl bg-foreground px-5 py-2 text-[12px] font-medium text-surface hover:opacity-90"
                                        >
                                            Submit Test
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* REVIEW SCREEN */}
                        {testMode === "review" && (
                            <div className="space-y-6">
                                {/* Score summary */}
                                <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 text-center space-y-4">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-surface">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-foreground">
                                            Score: {material.userProgress?.lastAttemptScore ?? 0} / {material.testData.totalMarks} Marks
                                        </h2>
                                        <p className="mt-1 text-[13px] text-foreground-muted">
                                            Test recorded into your academic preparation progress.
                                        </p>
                                    </div>
                                    <div className="flex justify-center gap-3 pt-2">
                                        <button
                                            onClick={handleRestartTest}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-[12px] font-medium text-foreground hover:bg-surface-subtle"
                                        >
                                            <RotateCcw size={13} />
                                            <span>Retry Test</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Answers and explanations review */}
                                <div className="space-y-4">
                                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-foreground-muted">
                                        Detailed Question Review & Explanations
                                    </h3>

                                    {material.testData.questions.map((q, idx) => {
                                        const userChoice = selectedAnswers[q.id];
                                        const isCorrect = userChoice === q.correctAnswerIndex;

                                        return (
                                            <div
                                                key={q.id}
                                                className={`rounded-xl border p-5 ${
                                                    isCorrect
                                                        ? "border-green-500/20 bg-green-500/5"
                                                        : "border-red-500/20 bg-red-500/5"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {isCorrect ? (
                                                            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <XCircle size={16} className="text-red-600 dark:text-red-400" />
                                                        )}
                                                        <span className="text-[12px] font-semibold">
                                                            Question {idx + 1} ({isCorrect ? `+${q.marks}` : "0"} marks)
                                                        </span>
                                                    </div>
                                                </div>

                                                <h4 className="mt-2 text-[14.5px] font-medium text-foreground">
                                                    {q.question}
                                                </h4>

                                                <div className="mt-3 space-y-1.5 text-[13px]">
                                                    {q.options.map((opt, optIdx) => {
                                                        const isUser = userChoice === optIdx;
                                                        const isAns = optIdx === q.correctAnswerIndex;

                                                        let badgeClass = "text-foreground-muted";
                                                        if (isAns) badgeClass = "font-semibold text-green-700 dark:text-green-300";
                                                        if (isUser && !isAns) badgeClass = "line-through text-red-600 dark:text-red-400";

                                                        return (
                                                            <div key={optIdx} className={`flex items-start gap-2 ${badgeClass}`}>
                                                                <span>{String.fromCharCode(65 + optIdx)}.</span>
                                                                <span>{opt} {isAns && "✓ (Correct Answer)"} {isUser && !isAns && "✗ (Your Choice)"}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {q.explanation && (
                                                    <div className="mt-3 rounded-lg border border-border-subtle bg-background p-3 text-[12px] text-foreground-secondary">
                                                        <strong className="text-foreground">Explanation: </strong>
                                                        {q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ==================================================== */}
                {/* 2. REGULAR DOCUMENT / NOTES READER                  */}
                {/* ==================================================== */}
                {!isMockTest && (
                    <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-6">
                        {material.content ? (
                            <div className="prose prose-neutral dark:prose-invert max-w-none text-[14px] leading-relaxed whitespace-pre-wrap font-sans">
                                {material.content}
                            </div>
                        ) : (
                            <p className="text-[13px] text-foreground-muted italic">
                                No text content attached to this resource record.
                            </p>
                        )}

                        {material.url && (
                            <div className="border-t border-border-subtle pt-4">
                                <a
                                    href={material.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground hover:underline"
                                >
                                    <span>Open External Reference</span>
                                    <ArrowRight size={14} />
                                </a>
                            </div>
                        )}
                    </article>
                )}
            </div>
        </main>
    );
}
