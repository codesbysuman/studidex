// app/subjects/subjects-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
    BookOpen,
    Plus,
    X,
    ArrowRight,
    Layers,
    FileText,
    Award,
    CheckCircle2,
} from "lucide-react";
import { useStudidex, type AuthUser } from "@/lib/use-studidex";
import { type StudidexState } from "@/lib/core";

export default function SubjectsPageClient({
    initialUser,
    initialState,
    isDbConnected,
}: {
    initialUser?: AuthUser | null;
    initialState?: StudidexState | null;
    isDbConnected?: boolean;
} = {}) {
    const { state, addSubject } = useStudidex({
        user: initialUser,
        state: initialState,
        isDbConnected,
    });
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");

    const handleCreateSubject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        addSubject({
            name: name.trim(),
            code: code.trim() || undefined,
            description: description.trim() || undefined,
        });

        setName("");
        setCode("");
        setDescription("");
        setIsAddOpen(false);
    };

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-10">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Academic Curriculum
                    </p>
                    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                                Subjects & Papers
                            </h1>
                            <p className="mt-1 text-[14px] text-foreground-muted">
                                Your enrolled courses, syllabus units, and study material indices.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsAddOpen(true)}
                            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-foreground px-4 py-2 text-[12.5px] font-semibold text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all"
                        >
                            <Plus size={14} />
                            <span>Add Subject</span>
                        </button>
                    </div>
                </header>

                {/* Subjects Grid */}
                {state.subjects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border-subtle bg-surface p-10 text-center space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">
                            No Subjects Added Yet
                        </h3>
                        <p className="text-[13px] text-foreground-muted max-w-sm mx-auto">
                            Add your enrolled courses or classes to track units, notes, and exams in one place.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsAddOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-[13px] font-medium text-surface hover:opacity-90 transition-opacity"
                        >
                            <Plus size={15} />
                            <span>Add Your First Subject</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {state.subjects.map((subject) => {
                        const relatedTopics = state.topics.filter((t) => t.subjectId === subject.id);
                        const relatedMaterials = state.materials.filter((m) => m.subjectId === subject.id);
                        const relatedItems = state.items.filter((i) => i.subjectId === subject.id);
                        const upcomingExams = relatedItems.filter(
                            (i) => i.eventType === "exam" || i.eventType === "test"
                        );

                        return (
                            <Link
                                key={subject.id}
                                href={`/subjects/${subject.id}`}
                                className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all hover:border-foreground hover:shadow-xs"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        {subject.code ? (
                                            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                {subject.code}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-foreground-muted">Core Paper</span>
                                        )}

                                        <span className="rounded bg-surface-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                                            {relatedTopics.length} Units
                                        </span>
                                    </div>

                                    <h3 className="mt-2.5 text-lg font-semibold text-foreground group-hover:underline">
                                        {subject.name}
                                    </h3>

                                    {subject.description && (
                                        <p className="mt-1 text-[12.5px] text-foreground-muted line-clamp-2">
                                            {subject.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6 border-t border-border-subtle pt-3 flex items-center justify-between text-[12px] text-foreground-muted">
                                    <div className="flex items-center gap-3">
                                        <span>{relatedMaterials.length} materials</span>
                                        {upcomingExams.length > 0 && (
                                            <span className="font-medium text-foreground">
                                                {upcomingExams.length} upcoming test
                                            </span>
                                        )}
                                    </div>

                                    <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:translate-x-0.5 transition-transform">
                                        <span>View</span>
                                        <ArrowRight size={13} />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                )}
            </div>

            {/* Add Subject Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                                <h3 className="text-[15px] font-semibold text-foreground">
                                    Add New Subject / Paper
                                </h3>
                                <button
                                    onClick={() => setIsAddOpen(false)}
                                    className="text-foreground-muted hover:text-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubject} className="mt-4 space-y-3.5">
                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Subject Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Constitutional Law"
                                        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Subject Code
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="e.g. LAW-CC-301"
                                        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Course overview or instructor details..."
                                        className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-[13px] text-foreground focus:border-foreground focus:outline-none resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="mt-4 w-full rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-surface hover:opacity-90 transition-opacity"
                                >
                                    Save Subject
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
