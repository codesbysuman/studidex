// app/add/add-client.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Copy,
    FileCode,
    FileText,
    HelpCircle,
    Info,
    Sparkles,
    Upload,
    Share2,
    X,
    Plus,
    Calendar,
    Clock,
    BookOpen,
    AlertCircle,
    GraduationCap,
    CheckSquare,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { validateImportJson, ValidationResult, ExternalImportEnvelope } from "@/lib/core";

const SAMPLE_EXTERNAL_JSON = `{
  "version": 1,
  "input": {
    "type": "message",
    "source": {
      "type": "department",
      "name": "Economics Department Announcement"
    },
    "content": "Attention 2nd Year: Microeconomics Mid-Semester Exam scheduled for 28 October 2026, 11:30 AM in Hall B. Market Structures essay must be submitted before the exam. Teacher handout on Monopolistic Competition has been shared."
  },
  "subjects": [
    {
      "name": "Economics",
      "code": "ECO201"
    }
  ],
  "topics": [
    {
      "name": "Market Structures",
      "subject": "Economics",
      "unit": "Unit 3"
    }
  ],
  "items": [
    {
      "type": "event",
      "eventType": "exam",
      "title": "Microeconomics Mid-Semester Exam",
      "description": "Mid-semester written exam on Market Structures and Consumer Theory. 30 marks.",
      "subject": "Economics",
      "topics": ["Market Structures"],
      "startAt": "2026-10-28T11:30:00.000Z",
      "endAt": "2026-10-28T13:00:00.000Z",
      "priority": "high",
      "metadata": {
        "room": "Hall B",
        "marks": 30
      }
    },
    {
      "type": "action",
      "actionType": "assignment",
      "title": "Submit Market Structures Essay",
      "description": "5-page essay evaluating oligopoly price rigidity and kinked demand curve.",
      "subject": "Economics",
      "topics": ["Market Structures"],
      "dueAt": "2026-10-28T11:00:00.000Z",
      "priority": "high",
      "preparesForTitle": "Microeconomics Mid-Semester Exam"
    },
    {
      "type": "action",
      "actionType": "preparation",
      "title": "Revise Monopolistic Competition Handout",
      "description": "Review excess capacity theorem and Chamberlin model diagrams",
      "subject": "Economics",
      "topics": ["Market Structures"],
      "dueAt": "2026-10-27T20:00:00.000Z",
      "priority": "normal",
      "preparesForTitle": "Microeconomics Mid-Semester Exam"
    }
  ],
  "materials": [
    {
      "type": "handout",
      "title": "Teacher Handout: Monopolistic Competition",
      "description": "Summary notes distributed by Prof. Verma covering Chamberlinian tangency and price determination.",
      "subject": "Economics",
      "topics": ["Market Structures"],
      "origin": "teacher",
      "content": "Key Concepts:\\n1. Product differentiation creates downward sloping individual demand.\\n2. Long run equilibrium occurs where P = AC, resulting in zero economic profit but excess capacity.",
      "metadata": {
        "unit": "Unit 3"
      }
    }
  ]
}`;

const AI_PROMPT_TEMPLATE = `You are the Studidex Academic Assistant.
Convert raw academic inputs (class notices, circulars, syllabi, exam schedules) into formatted JSON for my study space:

{
  "version": 1,
  "input": {
    "type": "message",
    "source": { "type": "department | college | university | teacher", "name": "Source Name" },
    "content": "original notice verbatim"
  },
  "subjects": [{ "name": "Subject Name", "code": "Course Code" }],
  "topics": [{ "name": "Topic Name", "subject": "Subject Name", "unit": "Unit 1" }],
  "items": [
    {
      "type": "event | action | update",
      "title": "Concise Title",
      "description": "Helpful context or details",
      "subject": "Subject Name",
      "topics": ["Topic Name"],
      "startAt": "ISO date string or omit",
      "dueAt": "ISO date string or omit",
      "priority": "low | normal | high | urgent",
      "eventType": "class | exam | test | deadline",
      "actionType": "assignment | study | preparation | submission"
    }
  ],
  "materials": [
    {
      "type": "note | handout | syllabus",
      "title": "Material Title",
      "subject": "Subject Name",
      "topics": ["Topic Name"],
      "origin": "personal | teacher | college",
      "content": "notes or text"
    }
  ]
}

Return valid JSON only. Preserve exact dates.`;

export default function AddImportPage() {
    const router = useRouter();
    const { state, addItem, addMaterial, addSubject, importEnvelope } = useStudidex();

    const [activeTab, setActiveTab] = useState<"quick" | "ai" | "import" | "prompt" | "guide">("quick");

    // Quick Add Form State
    const [quickKind, setQuickKind] = useState<"assignment" | "exam" | "class" | "note">("assignment");
    const [quickTitle, setQuickTitle] = useState("");
    const [quickSubjectId, setQuickSubjectId] = useState("");
    const [quickNewSubject, setQuickNewSubject] = useState("");
    const [quickDate, setQuickDate] = useState("");
    const [quickTime, setQuickTime] = useState("");
    const [quickPriority, setQuickPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
    const [quickNotes, setQuickNotes] = useState("");
    const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

    // AI Smart Intake State
    const [rawAiInput, setRawAiInput] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Data Import State
    const [jsonInput, setJsonInput] = useState("");
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [step, setStep] = useState<"input" | "preview" | "success">("input");
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [importSuccessCount, setImportSuccessCount] = useState<{
        events: number;
        actions: number;
        materials: number;
        updates: number;
        opportunities: number;
    }>({ events: 0, actions: 0, materials: 0, updates: 0, opportunities: 0 });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const pending = sessionStorage.getItem("studidex_pending_import");
            if (pending) {
                sessionStorage.removeItem("studidex_pending_import");
                setJsonInput(pending);
                const res = validateImportJson(pending);
                setValidation(res);
                if (res.valid && res.normalizedPayload) {
                    setActiveTab("import");
                    setStep("preview");
                }
            }
        }
    }, []);

    // Handle Quick Manual Add
    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTitle.trim()) return;

        let subjectId = quickSubjectId;
        if (!subjectId && quickNewSubject.trim()) {
            addSubject({ name: quickNewSubject.trim() });
            const created = state.subjects.find((s) => s.name.toLowerCase() === quickNewSubject.trim().toLowerCase());
            if (created) subjectId = created.id;
        }

        const dateIso = quickDate
            ? new Date(`${quickDate}T${quickTime || "10:00"}:00`).toISOString()
            : undefined;

        if (quickKind === "note") {
            addMaterial({
                type: "note",
                title: quickTitle.trim(),
                description: quickNotes.trim() || undefined,
                content: quickNotes.trim() || undefined,
                subjectId: subjectId || undefined,
                origin: "personal",
            });
            setQuickSuccess(`Added note "${quickTitle.trim()}" to your study materials!`);
        } else if (quickKind === "exam") {
            addItem({
                type: "event",
                eventType: "exam",
                title: quickTitle.trim(),
                description: quickNotes.trim() || undefined,
                subjectId: subjectId || undefined,
                startAt: dateIso,
                priority: quickPriority,
                status: "active",
            });
            setQuickSuccess(`Scheduled exam "${quickTitle.trim()}" in your agenda!`);
        } else if (quickKind === "class") {
            addItem({
                type: "event",
                eventType: "class",
                title: quickTitle.trim(),
                description: quickNotes.trim() || undefined,
                subjectId: subjectId || undefined,
                startAt: dateIso,
                priority: quickPriority,
                status: "active",
            });
            setQuickSuccess(`Added class "${quickTitle.trim()}" to your timetable!`);
        } else {
            // Assignment / Task
            addItem({
                type: "action",
                actionType: "assignment",
                title: quickTitle.trim(),
                description: quickNotes.trim() || undefined,
                subjectId: subjectId || undefined,
                dueAt: dateIso,
                priority: quickPriority,
                status: "active",
            });
            setQuickSuccess(`Added task "${quickTitle.trim()}" to your action list!`);
        }

        setQuickTitle("");
        setQuickNotes("");
        setQuickDate("");
        setQuickTime("");
        setQuickNewSubject("");
        setTimeout(() => setQuickSuccess(null), 3500);
    };

    // Handle AI Smart Compile
    const handleCompileWithAi = async () => {
        if (!rawAiInput.trim()) return;
        setAiLoading(true);
        setAiError(null);

        try {
            const res = await fetch("/api/ai/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input: rawAiInput }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Unable to parse text.");
            }

            const payload = data.normalizedPayload || data.raw;
            setJsonInput(JSON.stringify(payload, null, 2));
            const vRes = validateImportJson(JSON.stringify(payload));
            setValidation(vRes);
            if (vRes.valid) {
                setActiveTab("import");
                setStep("preview");
            } else {
                setAiError("We couldn't detect clear study items. Try adding details manually!");
            }
        } catch (err: any) {
            setAiError(err?.message || "Unable to organize text right now.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleValidate = () => {
        const res = validateImportJson(jsonInput);
        setValidation(res);
        if (res.valid && res.normalizedPayload) {
            setStep("preview");
        }
    };

    const handleLoadSample = () => {
        setJsonInput(SAMPLE_EXTERNAL_JSON);
        const res = validateImportJson(SAMPLE_EXTERNAL_JSON);
        setValidation(res);
        setStep("preview");
    };

    const handleConfirmImport = () => {
        if (!validation?.normalizedPayload) return;

        const payload = validation.normalizedPayload;
        const res = importEnvelope(payload);

        const events = res.newItems.filter((i) => i.type === "event").length;
        const actions = res.newItems.filter((i) => i.type === "action").length;
        const updates = res.newItems.filter((i) => i.type === "update").length;
        const opportunities = res.newItems.filter((i) => i.type === "opportunity").length;
        const materials = res.newMaterials.length;

        setImportSuccessCount({ events, actions, materials, updates, opportunities });
        setStep("success");
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2500);
    };

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-3xl space-y-8">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Intelligent Study Organizer
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                        Add Studies & Materials
                    </h1>
                    <p className="mt-1.5 text-[14px] text-foreground-muted leading-relaxed">
                        Create tasks directly, paste announcements to organize automatically, or import notes from classmates.
                    </p>

                    {/* Navigation Tabs */}
                    <div className="mt-6 flex flex-wrap gap-2 border-b border-border-subtle pb-2">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("quick");
                                if (step === "success") setStep("input");
                            }}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${activeTab === "quick"
                                    ? "bg-foreground text-surface font-semibold"
                                    : "text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
                                }`}
                        >
                            <Plus size={15} />
                            <span>Quick Add</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("ai");
                                if (step === "success") setStep("input");
                            }}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${activeTab === "ai"
                                    ? "bg-foreground text-surface font-semibold"
                                    : "text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
                                }`}
                        >
                            <Sparkles size={15} />
                            <span>Smart Paste (AI)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("import");
                                if (step === "success") setStep("input");
                            }}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${activeTab === "import"
                                    ? "bg-foreground text-surface font-semibold"
                                    : "text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
                                }`}
                        >
                            <Upload size={15} />
                            <span>Import Notes</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("prompt")}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${activeTab === "prompt"
                                    ? "bg-foreground text-surface font-semibold"
                                    : "text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
                                }`}
                        >
                            <Share2 size={15} />
                            <span>Prompt Helper</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("guide")}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${activeTab === "guide"
                                    ? "bg-foreground text-surface font-semibold"
                                    : "text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
                                }`}
                        >
                            <Info size={15} />
                            <span>What You Can Track</span>
                        </button>
                    </div>
                </header>

                {/* Tab 1: Quick Add Form */}
                {activeTab === "quick" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {quickSuccess && (
                            <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-[13px] text-green-700 dark:text-green-300">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={17} />
                                    <span>{quickSuccess}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push(quickKind === "assignment" ? "/actions" : "/plan")}
                                        className="font-semibold underline hover:opacity-80"
                                    >
                                        View Schedule
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleQuickAdd} className="rounded-2xl border border-border bg-surface p-6 space-y-5">
                            <div>
                                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground-muted">
                                    What are you adding?
                                </label>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: "assignment", label: "Assignment / Task", icon: CheckSquare },
                                        { id: "exam", label: "Exam / Quiz", icon: GraduationCap },
                                        { id: "class", label: "Lecture / Class", icon: Calendar },
                                        { id: "note", label: "Study Note", icon: BookOpen },
                                    ].map((opt) => {
                                        const Icon = opt.icon;
                                        const isSelected = quickKind === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setQuickKind(opt.id as any)}
                                                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all text-[12.5px] font-medium ${isSelected
                                                        ? "border-foreground bg-surface shadow-2xs font-semibold text-foreground"
                                                        : "border-border-subtle bg-surface-subtle/30 text-foreground-muted hover:border-border hover:text-foreground"
                                                    }`}
                                            >
                                                <Icon size={15} />
                                                <span>{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground-muted">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={quickTitle}
                                    onChange={(e) => setQuickTitle(e.target.value)}
                                    placeholder={
                                        quickKind === "exam"
                                            ? "e.g. Microeconomics Mid-Semester Exam"
                                            : quickKind === "class"
                                                ? "e.g. Political Theory Lecture (Hall 4)"
                                                : quickKind === "note"
                                                    ? "e.g. Chapter 3: Key Definitions and Diagrams"
                                                    : "e.g. Complete Market Structures Essay"
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                    required
                                />
                            </div>

                            {/* Subject selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground-muted">
                                        Subject / Course
                                    </label>
                                    <select
                                        value={quickSubjectId}
                                        onChange={(e) => {
                                            setQuickSubjectId(e.target.value);
                                            if (e.target.value) setQuickNewSubject("");
                                        }}
                                        className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[12.5px] text-foreground focus:border-foreground focus:outline-none"
                                    >
                                        <option value="">Select an enrolled subject...</option>
                                        {state.subjects.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name} {sub.code ? `(${sub.code})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {!quickSubjectId && (
                                    <div>
                                        <label className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            Or type new subject name
                                        </label>
                                        <input
                                            type="text"
                                            value={quickNewSubject}
                                            onChange={(e) => setQuickNewSubject(e.target.value)}
                                            placeholder="e.g. Macroeconomics"
                                            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[12.5px] text-foreground focus:border-foreground focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Date, Time & Priority */}
                            {quickKind !== "note" && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            {quickKind === "assignment" ? "Due Date" : "Date"}
                                        </label>
                                        <input
                                            type="date"
                                            value={quickDate}
                                            onChange={(e) => setQuickDate(e.target.value)}
                                            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:border-foreground focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            value={quickTime}
                                            onChange={(e) => setQuickTime(e.target.value)}
                                            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:border-foreground focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            Priority
                                        </label>
                                        <select
                                            value={quickPriority}
                                            onChange={(e) => setQuickPriority(e.target.value as any)}
                                            className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:border-foreground focus:outline-none"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="high">High Priority</option>
                                            <option value="urgent">Urgent</option>
                                            <option value="low">Low Priority</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Details / Notes */}
                            <div>
                                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground-muted">
                                    Details & Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={quickNotes}
                                    onChange={(e) => setQuickNotes(e.target.value)}
                                    placeholder="Add instructions, room location, syllabus chapters covered, or reminders..."
                                    className="mt-1.5 w-full rounded-xl border border-border bg-surface p-3 text-[13px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-semibold text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all"
                                >
                                    <Plus size={15} />
                                    <span>Add to Studidex</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Tab 2: Smart Paste (AI) */}
                {activeTab === "ai" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                            <div>
                                <h3 className="text-[16px] font-semibold text-foreground">
                                    Paste Announcement or Course Notice
                                </h3>
                                <p className="mt-1 text-[13px] text-foreground-muted leading-relaxed">
                                    Paste messy college circulars, WhatsApp group messages, class cancellations, or syllabus modules. Studidex automatically extracts the schedule, tasks, and materials for you.
                                </p>
                            </div>

                            {aiError && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[12.5px] text-red-600 dark:text-red-400">
                                    {aiError}
                                </div>
                            )}

                            <textarea
                                rows={7}
                                value={rawAiInput}
                                onChange={(e) => setRawAiInput(e.target.value)}
                                placeholder="e.g. Attention Economics Students: Mid-Semester exam will be held on 28 October 2026, 11:30 AM in Hall B. Market Structures essay submission deadline is 27 October 8:00 PM..."
                                className="w-full rounded-xl border border-border bg-surface p-4 text-[13px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none leading-relaxed"
                            />

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        "📅 Class schedule change",
                                        "📝 Homework announcement",
                                        "🎯 Upcoming exam circular",
                                    ].map((chip) => (
                                        <button
                                            key={chip}
                                            type="button"
                                            onClick={() => setRawAiInput(chip.slice(2).trim() + ": ")}
                                            className="rounded-lg border border-border-subtle bg-surface-subtle/40 px-2.5 py-1 text-[11px] text-foreground-muted hover:border-foreground/30 hover:text-foreground"
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCompileWithAi}
                                    disabled={!rawAiInput.trim() || aiLoading}
                                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-semibold text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all disabled:opacity-40"
                                >
                                    <Sparkles size={14} />
                                    <span>{aiLoading ? "Organizing with Assistant..." : "Organize & Preview"}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tab 3: Import Data */}
                {activeTab === "import" && (
                    <div className="space-y-6">
                        {step === "input" && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 rounded-2xl border border-border bg-surface p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[15px] font-semibold text-foreground">
                                            Import Structured Notes or Backup
                                        </h3>
                                        <p className="text-[12.5px] text-foreground-muted">
                                            Paste formatted notes shared by classmates or a previous backup file.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleLoadSample}
                                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:underline"
                                    >
                                        <Sparkles size={13} />
                                        <span>Load Demo Notice</span>
                                    </button>
                                </div>

                                <textarea
                                    id="json-input"
                                    rows={10}
                                    value={jsonInput}
                                    onChange={(e) => {
                                        setJsonInput(e.target.value);
                                        setValidation(null);
                                    }}
                                    placeholder={`{\n  "version": 1,\n  "items": [\n    { "title": "Economics Exam", "type": "event", "eventType": "exam" }\n  ]\n}`}
                                    className="w-full rounded-xl border border-border bg-surface p-4 font-mono text-[12px] leading-relaxed text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none"
                                />

                                {validation && !validation.valid && (
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-600 dark:text-red-400">
                                        <p className="font-semibold">Check formatted text:</p>
                                        <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[12px]">
                                            {validation.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-[12px] text-foreground-muted">
                                        We verify your items before adding them to your schedule.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleValidate}
                                        disabled={!jsonInput.trim()}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-[13px] font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
                                    >
                                        <span>Review & Add</span>
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Preview Screen */}
                        {step === "preview" && validation?.normalizedPayload && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                                        <div>
                                            <span className="inline-block rounded-full bg-surface-subtle px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                                                Ready to add
                                            </span>
                                            <h2 className="mt-1 text-xl font-semibold text-foreground">
                                                Review Items Before Saving
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep("input")}
                                            className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Breakdown counts */}
                                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-3 text-center">
                                            <span className="text-xl font-bold text-foreground">
                                                {validation.normalizedPayload.items?.filter((i) => i.type === "event").length || 0}
                                            </span>
                                            <p className="text-[11px] text-foreground-muted">Events & Exams</p>
                                        </div>
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-3 text-center">
                                            <span className="text-xl font-bold text-foreground">
                                                {validation.normalizedPayload.items?.filter((i) => i.type === "action").length || 0}
                                            </span>
                                            <p className="text-[11px] text-foreground-muted">Tasks & Homework</p>
                                        </div>
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-3 text-center">
                                            <span className="text-xl font-bold text-foreground">
                                                {validation.normalizedPayload.materials?.length || 0}
                                            </span>
                                            <p className="text-[11px] text-foreground-muted">Study Materials</p>
                                        </div>
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-3 text-center">
                                            <span className="text-xl font-bold text-foreground">
                                                {validation.normalizedPayload.subjects?.length || 0}
                                            </span>
                                            <p className="text-[11px] text-foreground-muted">Subjects</p>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="mt-6 space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {validation.normalizedPayload.items?.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-xl border border-border-subtle bg-surface-subtle/20 p-3 flex items-start justify-between gap-3 text-[13px]"
                                            >
                                                <div>
                                                    <p className="font-semibold text-foreground">{item.title}</p>
                                                    {item.description && (
                                                        <p className="text-[12px] text-foreground-muted mt-0.5 line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-foreground-faint">
                                                        {item.subject && <span>Subject: {item.subject}</span>}
                                                        {item.startAt && <span>Date: {new Date(item.startAt).toLocaleDateString()}</span>}
                                                        {item.dueAt && <span>Due: {new Date(item.dueAt).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                                <span className="shrink-0 rounded bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted border border-border-subtle">
                                                    {item.eventType || item.actionType || item.type}
                                                </span>
                                            </div>
                                        ))}

                                        {validation.normalizedPayload.materials?.map((mat, idx) => (
                                            <div
                                                key={`mat-${idx}`}
                                                className="rounded-xl border border-border-subtle bg-surface-subtle/20 p-3 flex items-start justify-between gap-3 text-[13px]"
                                            >
                                                <div>
                                                    <p className="font-semibold text-foreground">{mat.title}</p>
                                                    {mat.description && (
                                                        <p className="text-[12px] text-foreground-muted mt-0.5">
                                                            {mat.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="shrink-0 rounded bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted border border-border-subtle">
                                                    {mat.type === "note" ? "Note" : "Handout"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-8 flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep("input")}
                                            className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-subtle"
                                        >
                                            Back & Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmImport}
                                            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2 text-[13px] font-medium text-surface shadow-sm hover:opacity-90"
                                        >
                                            <span>Add to My Schedule</span>
                                            <ArrowRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Success Screen */}
                        {step === "success" && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm"
                            >
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-surface">
                                    <CheckCircle2 size={28} />
                                </div>

                                <h2 className="mt-4 text-2xl font-semibold text-foreground">
                                    Successfully Added to Your Study Space
                                </h2>
                                <p className="mt-1 text-[14px] text-foreground-muted">
                                    Your calendar, agenda, and task lists have been updated.
                                </p>

                                <div className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-2 text-[12px]">
                                    {importSuccessCount.events > 0 && (
                                        <span className="rounded-lg bg-surface-subtle px-3 py-1 font-medium text-foreground">
                                            {importSuccessCount.events} Event{importSuccessCount.events > 1 ? "s" : ""}
                                        </span>
                                    )}
                                    {importSuccessCount.actions > 0 && (
                                        <span className="rounded-lg bg-surface-subtle px-3 py-1 font-medium text-foreground">
                                            {importSuccessCount.actions} Task{importSuccessCount.actions > 1 ? "s" : ""}
                                        </span>
                                    )}
                                    {importSuccessCount.materials > 0 && (
                                        <span className="rounded-lg bg-surface-subtle px-3 py-1 font-medium text-foreground">
                                            {importSuccessCount.materials} Material{importSuccessCount.materials > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-8 flex justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setJsonInput("");
                                            setValidation(null);
                                            setStep("input");
                                        }}
                                        className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-subtle"
                                    >
                                        Add More Items
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/")}
                                        className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2 text-[13px] font-medium text-surface hover:opacity-90"
                                    >
                                        <span>View Dashboard</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Tab 4: Prompt Helper */}
                {activeTab === "prompt" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="rounded-2xl border border-border bg-surface p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-[16px] font-semibold text-foreground">
                                        Use ChatGPT or Claude to Format Complex Notes
                                    </h3>
                                    <p className="mt-1 text-[13px] text-foreground-muted leading-relaxed">
                                        Copy this prompt and paste it into ChatGPT, Claude, or Gemini alongside any syllabus PDF or course circular. The AI formats it perfectly for Studidex.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyPrompt}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-subtle"
                                >
                                    {copiedPrompt ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    <span>{copiedPrompt ? "Copied!" : "Copy Prompt"}</span>
                                </button>
                            </div>

                            <pre className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-surface-subtle/30 p-4 text-[12px] font-mono leading-relaxed text-foreground-secondary">
                                {AI_PROMPT_TEMPLATE}
                            </pre>
                        </div>
                    </motion.div>
                )}

                {/* Tab 5: What You Can Track */}
                {activeTab === "guide" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="rounded-2xl border border-border bg-surface p-6">
                            <h3 className="text-[16px] font-semibold text-foreground">
                                Everything You Need for Academic Success
                            </h3>
                            <p className="mt-1 text-[13px] text-foreground-muted leading-relaxed">
                                You never have to worry about where things belong or lose track of upcoming deadlines:
                            </p>
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {[
                                    { title: "College & Class Group Notices", desc: "Lecture announcements, classroom relocations, rescheduled labs." },
                                    { title: "Exams & Unit Tests", desc: "Mid-semester papers, unit quizzes, final exam dates, and seatings." },
                                    { title: "Assignments & Homework", desc: "Essay submissions, lab write-ups, problem sets, and deadlines." },
                                    { title: "Study Handouts & Syllabus", desc: "Teacher handouts, reference readings, chapter outlines, and notes." },
                                ].map((item) => (
                                    <div key={item.title} className="rounded-xl border border-border-subtle bg-surface-subtle/20 p-4">
                                        <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
                                        <p className="mt-1 text-[12px] text-foreground-muted">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
