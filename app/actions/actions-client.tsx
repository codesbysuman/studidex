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
    Plus,
    X,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { getActionsGrouped, formatHumanDate, AcademicItem } from "@/lib/core";

export default function ActionsPage() {
    const { state, toggleAction, modifyItem, addItem } = useStudidex();
    const grouped = getActionsGrouped(state);
    const [viewFilter, setViewFilter] = useState<"all" | "active" | "completed">("active");

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDesc, setTaskDesc] = useState("");
    const [taskType, setTaskType] = useState<"assignment" | "study" | "preparation" | "submission">("assignment");
    const [taskSubjectId, setTaskSubjectId] = useState("");
    const [taskDueDate, setTaskDueDate] = useState("");
    const [taskPriority, setTaskPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskTitle.trim()) return;

        addItem({
            type: "action",
            actionType: taskType,
            title: taskTitle.trim(),
            description: taskDesc.trim() || undefined,
            subjectId: taskSubjectId || undefined,
            dueAt: taskDueDate ? new Date(`${taskDueDate}T23:59:00`).toISOString() : undefined,
            priority: taskPriority,
            status: "active",
        });

        setTaskTitle("");
        setTaskDesc("");
        setTaskDueDate("");
        setIsAddOpen(false);
    };

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

                        <button
                            type="button"
                            onClick={() => setIsAddOpen(true)}
                            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-foreground px-3.5 py-1.5 text-[12.5px] font-semibold text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all"
                        >
                            <Plus size={14} />
                            <span>New Task / Action</span>
                        </button>
                    </div>

                    {/* Filter tabs */}
                    <div className="mt-4 flex items-center gap-1.5">
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
                                        ? "bg-foreground text-surface font-semibold"
                                        : "border border-border-subtle bg-surface text-foreground-muted hover:text-foreground"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
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

                {/* Empty State for Active Tasks */}
                {viewFilter !== "completed" &&
                    grouped.overdue.length === 0 &&
                    grouped.doToday.length === 0 &&
                    grouped.upcoming.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface p-10 text-center space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground">
                                <CheckSquare size={24} />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">
                                All caught up!
                            </h3>
                            <p className="text-[13px] text-foreground-muted max-w-sm mx-auto">
                                You don't have any pending assignments or study tasks right now.
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-[13px] font-medium text-surface hover:opacity-90 transition-opacity"
                            >
                                <Plus size={15} />
                                <span>Create a Task</span>
                            </button>
                        </div>
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

            {/* Create Action Modal */}
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
                                    New Task or Assignment
                                </h3>
                                <button
                                    onClick={() => setIsAddOpen(false)}
                                    className="text-foreground-muted hover:text-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="mt-4 space-y-3.5">
                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Task Category
                                    </label>
                                    <select
                                        value={taskType}
                                        onChange={(e) => setTaskType(e.target.value as any)}
                                        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                    >
                                        <option value="assignment">Assignment / Essay</option>
                                        <option value="study">Study / Reading Task</option>
                                        <option value="preparation">Exam Drill / Practice</option>
                                        <option value="submission">Project / Practical Submission</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        placeholder="e.g. Write Chapter 3 Review Paper"
                                        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Subject
                                    </label>
                                    <select
                                        value={taskSubjectId}
                                        onChange={(e) => setTaskSubjectId(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                    >
                                        <option value="">General (No specific subject)</option>
                                        {state.subjects.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.code ? `(${s.code})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={taskDueDate}
                                            onChange={(e) => setTaskDueDate(e.target.value)}
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                            Priority
                                        </label>
                                        <select
                                            value={taskPriority}
                                            onChange={(e) => setTaskPriority(e.target.value as any)}
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Notes / Context
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={taskDesc}
                                        onChange={(e) => setTaskDesc(e.target.value)}
                                        placeholder="Requirements, reference notes, or questions..."
                                        className="mt-1 w-full rounded-xl border border-border bg-surface p-2.5 text-[12.5px] text-foreground focus:border-foreground focus:outline-none resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="mt-4 w-full rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-surface hover:opacity-90 transition-opacity"
                                >
                                    Add Task
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
