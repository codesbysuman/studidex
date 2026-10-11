// app/plan/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    ArrowRight,
    Award,
    Filter,
    Plus,
    Sparkles,
    X,
    Check,
    CheckCircle2,
    Loader2,
    BookOpen,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { getPlanAgenda, formatTime, formatHumanDate, AcademicItem } from "@/lib/core";

export default function PlanPage() {
    const { state, addItem } = useStudidex();
    const agendaGroups = getPlanAgenda(state);
    const [filterType, setFilterType] = useState<"all" | "exam" | "class" | "deadline">("all");

    // Quick Add Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [itemTitle, setItemTitle] = useState("");
    const [itemType, setItemType] = useState<"event" | "action">("event");
    const [itemSubType, setItemSubType] = useState("class");
    const [itemSubjectId, setItemSubjectId] = useState("");
    const [itemDate, setItemDate] = useState("");
    const [itemTime, setItemTime] = useState("10:00");
    const [itemPriority, setItemPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
    const [itemRoom, setItemRoom] = useState("");

    // AI Study Plan Generator Modal State
    const [isAiPlanOpen, setIsAiPlanOpen] = useState(false);
    const [aiExamName, setAiExamName] = useState("");
    const [aiSubject, setAiSubject] = useState("");
    const [aiDays, setAiDays] = useState(5);
    const [aiLoading, setAiLoading] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
    const [aiPlanError, setAiPlanError] = useState<string | null>(null);

    const handleCreateItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemTitle.trim() || !itemDate) return;

        const dateIso = new Date(`${itemDate}T${itemTime || "09:00"}:00`).toISOString();

        addItem({
            type: itemType,
            eventType: itemType === "event" ? (itemSubType as any) : undefined,
            actionType: itemType === "action" ? (itemSubType as any) : undefined,
            title: itemTitle.trim(),
            subjectId: itemSubjectId || undefined,
            startAt: itemType === "event" ? dateIso : undefined,
            dueAt: itemType === "action" ? dateIso : undefined,
            priority: itemPriority,
            status: "active",
            metadata: itemRoom ? { room: itemRoom } : undefined,
        });

        // Reset
        setItemTitle("");
        setItemRoom("");
        setIsAddOpen(false);
    };

    const handleGenerateAiPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiExamName.trim() || !aiSubject.trim()) return;

        setAiLoading(true);
        setAiPlanError(null);
        setGeneratedPlan(null);

        try {
            const res = await fetch("/api/ai/plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetExam: aiExamName.trim(),
                    subject: aiSubject.trim(),
                    daysAvailable: Number(aiDays) || 5,
                    hoursPerDay: 3,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to generate study plan.");
            }

            setGeneratedPlan(data.plan);
        } catch (err: any) {
            setAiPlanError(err?.message || "Failed to generate study plan.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleApplyAiPlan = () => {
        if (!generatedPlan?.dailySchedule) return;

        const baseTime = new Date();
        const selectedSubj = state.subjects.find(
            (s) => s.name.toLowerCase() === aiSubject.toLowerCase()
        );

        generatedPlan.dailySchedule.forEach((dayPlan: any, i: number) => {
            const targetDate = new Date(baseTime);
            targetDate.setDate(targetDate.getDate() + i + 1);
            targetDate.setHours(10, 0, 0, 0);

            // Add day revision action
            addItem({
                type: "action",
                actionType: "study",
                title: `Day ${dayPlan.day}: ${dayPlan.focus || dayPlan.targetGoal}`,
                description: `Target Goal: ${dayPlan.targetGoal} (${dayPlan.durationHours || 3} hrs)`,
                subjectId: selectedSubj?.id,
                dueAt: targetDate.toISOString(),
                priority: "high",
                status: "active",
                metadata: {
                    checklist: dayPlan.tasks?.map((t: any, idx: number) => ({
                        id: `chk_${idx}`,
                        text: t.title,
                        done: false,
                    })),
                },
            });
        });

        setIsAiPlanOpen(false);
        setGeneratedPlan(null);
    };

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
                                What’s happening and when. Classes, exams, deadlines, and revisions.
                            </p>
                        </div>

                        {/* Action buttons: Quick Add & AI Study Plan */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setIsAiPlanOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-foreground hover:bg-surface-subtle shadow-2xs transition-all active:scale-98"
                            >
                                <Sparkles size={13} />
                                <span>AI Study Plan</span>
                            </button>

                            <button
                                onClick={() => setIsAddOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-1.5 text-[12.5px] font-semibold text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all"
                            >
                                <Plus size={14} />
                                <span>Add Event / Class</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter pills */}
                    <div className="mt-5 flex flex-wrap items-center gap-1.5">
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
                                        ? "bg-foreground text-surface font-semibold"
                                        : "border border-border-subtle bg-surface text-foreground-muted hover:text-foreground"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Agenda Date Groups */}
                <div className="space-y-8">
                    {agendaGroups.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-foreground-muted">
                            <p className="text-[14px]">No scheduled events found.</p>
                            <button
                                onClick={() => setIsAddOpen(true)}
                                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground underline"
                            >
                                <Plus size={13} />
                                <span>Schedule an event or class now</span>
                            </button>
                        </div>
                    ) : (
                        agendaGroups.map((group) => {
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

                                    <div className="space-y-2">
                                        {filteredItems.map((item) => {
                                            const subject = state.subjects.find((s) => s.id === item.subjectId);
                                            const isExam = item.eventType === "exam" || item.eventType === "test";
                                            const timeString = item.startAt
                                                ? formatTime(item.startAt)
                                                : item.dueAt
                                                ? `Due ${formatTime(item.dueAt)}`
                                                : undefined;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="group flex flex-col justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-4 transition-all hover:border-border sm:flex-row sm:items-center"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-foreground-muted">
                                                            {isExam ? (
                                                                <Award size={15} className="text-foreground" />
                                                            ) : item.eventType === "class" ? (
                                                                <Clock size={15} />
                                                            ) : (
                                                                <CalendarIcon size={15} />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-[14.5px] font-medium text-foreground">
                                                                    {item.title}
                                                                </h3>
                                                                <span className="rounded bg-surface-subtle px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                                                                    {item.eventType === "exam"
                                                                        ? "Exam"
                                                                        : item.eventType === "test"
                                                                        ? "Quiz"
                                                                        : item.eventType === "class"
                                                                        ? "Class"
                                                                        : item.eventType === "deadline"
                                                                        ? "Deadline"
                                                                        : item.actionType === "assignment"
                                                                        ? "Assignment"
                                                                        : item.actionType === "study"
                                                                        ? "Study"
                                                                        : item.actionType === "preparation"
                                                                        ? "Prep"
                                                                        : item.type === "event"
                                                                        ? "Event"
                                                                        : "Task"}
                                                                </span>
                                                                {item.priority === "urgent" && (
                                                                    <span className="rounded bg-red-500/10 px-1.5 py-0.2 text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                                                                        Urgent
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-foreground-muted">
                                                                {timeString && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Clock size={12} />
                                                                        <span>{timeString}</span>
                                                                    </span>
                                                                )}
                                                                {item.metadata?.room && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <MapPin size={12} />
                                                                        <span>{String(item.metadata.room)}</span>
                                                                    </span>
                                                                )}
                                                                {subject && (
                                                                    <span>· {subject.name}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Prepare link if exam */}
                                                    {isExam && (
                                                        <Link
                                                            href={`/prepare/${item.id}`}
                                                            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-foreground hover:bg-surface-subtle sm:self-auto"
                                                        >
                                                            <span>Prepare</span>
                                                            <ArrowRight size={12} />
                                                        </Link>
                                                    )}
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

            {/* Quick Add Modal */}
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
                                    Schedule Class, Exam, or Task
                                </h3>
                                <button
                                    onClick={() => setIsAddOpen(false)}
                                    className="text-foreground-muted hover:text-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateItem} className="mt-4 space-y-3.5">
                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Category
                                    </label>
                                    <div className="mt-1 grid grid-cols-2 gap-2">
                                        <select
                                            value={itemType}
                                            onChange={(e) => setItemType(e.target.value as any)}
                                            className="rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                        >
                                            <option value="event">Scheduled Time (Class / Exam)</option>
                                            <option value="action">Due Date (Assignment / Task)</option>
                                        </select>
                                        <select
                                            value={itemSubType}
                                            onChange={(e) => setItemSubType(e.target.value)}
                                            className="rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                        >
                                            {itemType === "event" ? (
                                                <>
                                                    <option value="class">Lecture / Class</option>
                                                    <option value="exam">Mid-Term / Final Exam</option>
                                                    <option value="test">Unit Test / Quiz</option>
                                                    <option value="deadline">Assessment Due</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="assignment">Assignment / Essay</option>
                                                    <option value="study">Study / Revision</option>
                                                    <option value="preparation">Exam Drill</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={itemTitle}
                                        onChange={(e) => setItemTitle(e.target.value)}
                                        placeholder="e.g. Political Theory Mid-Term Exam"
                                        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                        Subject
                                    </label>
                                    <select
                                        value={itemSubjectId}
                                        onChange={(e) => setItemSubjectId(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:border-foreground focus:outline-none"
                                    >
                                        <option value="">No specific subject</option>
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
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={itemDate}
                                            onChange={(e) => setItemDate(e.target.value)}
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            value={itemTime}
                                            onChange={(e) => setItemTime(e.target.value)}
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                            Priority
                                        </label>
                                        <select
                                            value={itemPriority}
                                            onChange={(e) => setItemPriority(e.target.value as any)}
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                            Room / Hall
                                        </label>
                                        <input
                                            type="text"
                                            value={itemRoom}
                                            onChange={(e) => setItemRoom(e.target.value)}
                                            placeholder="Room 302"
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="mt-4 w-full rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-surface hover:opacity-90 transition-opacity"
                                >
                                    Add to Schedule
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Study Plan Modal */}
            <AnimatePresence>
                {isAiPlanOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAiPlanOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={17} />
                                    <h3 className="text-[15px] font-semibold text-foreground">
                                        AI Study Plan Generator
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsAiPlanOpen(false)}
                                    className="text-foreground-muted hover:text-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {aiPlanError && (
                                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[12px] text-red-600 dark:text-red-400">
                                    {aiPlanError}
                                </div>
                            )}

                            {!generatedPlan ? (
                                <form onSubmit={handleGenerateAiPlan} className="mt-4 space-y-3.5">
                                    <div>
                                        <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                            Target Exam / Test
                                        </label>
                                        <input
                                            type="text"
                                            value={aiExamName}
                                            onChange={(e) => setAiExamName(e.target.value)}
                                            placeholder="e.g. Microeconomics Mid-Semester Exam"
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={aiSubject}
                                            onChange={(e) => setAiSubject(e.target.value)}
                                            placeholder="e.g. Economics"
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                                            Days Available
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={aiDays}
                                            onChange={(e) => setAiDays(Number(e.target.value))}
                                            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={aiLoading}
                                        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {aiLoading ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                <span>Designing daily agenda...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={14} />
                                                <span>Generate Revision Schedule</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3 text-[12.5px] text-foreground">
                                        <p className="font-semibold">{generatedPlan.summary}</p>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {generatedPlan.dailySchedule?.map((day: any) => (
                                            <div
                                                key={day.day}
                                                className="rounded-xl border border-border-subtle bg-surface p-3 text-[12.5px] space-y-1"
                                            >
                                                <div className="flex items-center justify-between font-semibold text-foreground">
                                                    <span>Day {day.day}: {day.focus}</span>
                                                    <span className="text-[11px] text-foreground-muted">{day.durationHours} hrs</span>
                                                </div>
                                                <p className="text-[12px] text-foreground-muted">{day.targetGoal}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setGeneratedPlan(null)}
                                            className="rounded-xl border border-border px-3 py-1.5 text-[12px] font-medium text-foreground-muted hover:text-foreground"
                                        >
                                            Edit Request
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleApplyAiPlan}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-1.5 text-[12px] font-semibold text-surface hover:opacity-90"
                                        >
                                            <Check size={14} />
                                            <span>Add All Days to Plan</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
