// app/add/page.tsx
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
    MessageSquare,
    Sparkles,
    Upload,
    X,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { validateImportJson, ValidationResult, ExternalImportEnvelope } from "@/lib/core";

const SAMPLE_EXTERNAL_JSON = `{
  "version": 1,
  "input": {
    "type": "message",
    "source": {
      "type": "department",
      "name": "Economics Department WhatsApp Group"
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

const AI_PROMPT_TEMPLATE = `You are the Studidex Academic Information Compiler.
Convert raw academic inputs (WhatsApp notices, circulars, syllabi, exam schedules) into strict JSON matching this format:

{
  "version": 1,
  "input": {
    "type": "message",
    "source": { "type": "department | college | university | teacher | web", "name": "Source Name" },
    "content": "preserve original input verbatim"
  },
  "subjects": [{ "name": "Subject Name", "code": "Code if known" }],
  "topics": [{ "name": "Topic Name", "subject": "Subject Name", "unit": "Unit 1" }],
  "items": [
    {
      "type": "event | action | update | opportunity",
      "title": "Concise Title",
      "description": "Helpful context",
      "subject": "Subject Name",
      "topics": ["Topic Name"],
      "startAt": "ISO date string or omit",
      "dueAt": "ISO date string or omit",
      "priority": "low | normal | high | urgent",
      "eventType": "class | exam | test | deadline | submission",
      "actionType": "assignment | study | preparation | submission | application",
      "metadata": { "room": "...", "marks": "..." }
    }
  ],
  "materials": [
    {
      "type": "note | pdf | document | syllabus | pyq | mock_test | handout",
      "title": "Title",
      "subject": "Subject Name",
      "topics": ["Topic Name"],
      "origin": "personal | teacher | college | library | system",
      "content": "text content if available"
    }
  ]
}

Return ONLY valid JSON. Never hallucinate facts. Preserve exact dates.`;

export default function AddImportPage() {
    const router = useRouter();
    const { importEnvelope } = useStudidex();

    const [activeTab, setActiveTab] = useState<"json" | "prompt" | "types">("json");
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
                    setStep("preview");
                }
            }
        }
    }, []);

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

        // Count categories
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
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-12">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Intelligent Input Intake
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                        Add / Import
                    </h1>
                    <p className="mt-2 text-[14px] text-foreground-muted">
                        Give Studidex messy academic messages or structured notes. Studidex organizes it into your personalized study space.
                    </p>

                    {/* Mode Tabs */}
                    <div className="mt-6 flex flex-wrap gap-2 border-b border-border-subtle pb-2">
                        <button
                            onClick={() => {
                                setActiveTab("json");
                                if (step === "success") setStep("input");
                            }}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                                activeTab === "json"
                                    ? "bg-foreground text-surface"
                                    : "text-foreground-muted hover:text-foreground"
                            }`}
                        >
                            <FileCode size={15} />
                            <span>Paste Studidex JSON</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("prompt")}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                                activeTab === "prompt"
                                    ? "bg-foreground text-surface"
                                    : "text-foreground-muted hover:text-foreground"
                            }`}
                        >
                            <Sparkles size={15} />
                            <span>External AI Prompt</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("types")}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                                activeTab === "types"
                                    ? "bg-foreground text-surface"
                                    : "text-foreground-muted hover:text-foreground"
                            }`}
                        >
                            <Info size={15} />
                            <span>Supported Inputs</span>
                        </button>
                    </div>
                </div>

                {/* Tab: External AI Prompt */}
                {activeTab === "prompt" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 space-y-4"
                    >
                        <div className="rounded-xl border border-border-subtle bg-surface p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-[15px] font-medium text-foreground">
                                        External AI Compiler Workflow
                                    </h3>
                                    <p className="mt-1 text-[13px] text-foreground-muted leading-relaxed">
                                        Copy this prompt and paste it into ChatGPT, Claude, or Gemini alongside any messy WhatsApp college message, notice, or circular. The AI compiles it into strict Studidex JSON, which you paste right here.
                                    </p>
                                </div>
                                <button
                                    onClick={handleCopyPrompt}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-subtle"
                                >
                                    {copiedPrompt ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    <span>{copiedPrompt ? "Copied Prompt!" : "Copy Prompt"}</span>
                                </button>
                            </div>

                            <pre className="mt-4 overflow-x-auto rounded-lg border border-border-subtle bg-background p-4 text-[12px] font-mono leading-relaxed text-foreground-secondary">
                                {AI_PROMPT_TEMPLATE}
                            </pre>
                        </div>
                    </motion.div>
                )}

                {/* Tab: Supported Inputs */}
                {activeTab === "types" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 space-y-4"
                    >
                        <div className="rounded-xl border border-border-subtle bg-surface p-5">
                            <h3 className="text-[15px] font-medium text-foreground">
                                The Studidex Product Principle
                            </h3>
                            <p className="mt-2 text-[13px] text-foreground-muted leading-relaxed">
                                You never have to ask: <span className="italic text-foreground">"Which folder does this belong to?"</span> or <span className="italic text-foreground">"Is this a calendar event or a task?"</span>
                            </p>
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {[
                                    { title: "WhatsApp & College Groups", desc: "Circulars, class cancellations, rescheduled tests." },
                                    { title: "Department Notices", desc: "Office hours, internal test syllabus, room relocations." },
                                    { title: "Documents & Syllabi", desc: "Curriculum PDFs, recommended readings, PYQ sets." },
                                    { title: "Opportunities & Scholarships", desc: "Fellowship deadlines, internship drives, competitions." },
                                ].map((item) => (
                                    <div key={item.title} className="rounded-lg border border-border-subtle bg-background p-3.5">
                                        <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                                        <p className="mt-1 text-[12px] text-foreground-muted">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tab: JSON Import Interface */}
                {activeTab === "json" && (
                    <div className="mt-6">
                        {step === "input" && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <label htmlFor="json-input" className="text-[13px] font-medium text-foreground">
                                        Paste JSON output from external AI:
                                    </label>
                                    <button
                                        onClick={handleLoadSample}
                                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:underline"
                                    >
                                        <Sparkles size={13} />
                                        <span>Load Demo Notice JSON</span>
                                    </button>
                                </div>

                                <div className="relative">
                                    <textarea
                                        id="json-input"
                                        rows={12}
                                        value={jsonInput}
                                        onChange={(e) => {
                                            setJsonInput(e.target.value);
                                            setValidation(null);
                                        }}
                                        placeholder={`{\n  "version": 1,\n  "input": { "content": "..." },\n  "items": [...]\n}`}
                                        className="w-full rounded-xl border border-border bg-surface p-4 font-mono text-[12.5px] leading-relaxed text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                                    />
                                </div>

                                {/* Validation Error feedback */}
                                {validation && !validation.valid && (
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-600 dark:text-red-400">
                                        <p className="font-semibold">Validation Error</p>
                                        <ul className="mt-1 list-disc pl-5 space-y-0.5">
                                            {validation.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-[12px] text-foreground-muted">
                                        Input is validated and normalized before committing to your database.
                                    </p>
                                    <button
                                        onClick={handleValidate}
                                        disabled={!jsonInput.trim()}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-inverse px-5 text-[13px] font-medium text-inverse-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                                    >
                                        <span>Review & Parse</span>
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Concise Preview (Section 16) */}
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
                                                Ready to import
                                            </span>
                                            <h2 className="mt-1 text-xl font-semibold text-foreground">
                                                Information Breakdown Preview
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() => setStep("input")}
                                            className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Warnings if any */}
                                    {validation.warnings.length > 0 && (
                                        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-[12px] text-amber-700 dark:text-amber-300">
                                            <p className="font-semibold">Note:</p>
                                            <ul className="mt-1 list-disc pl-4 space-y-0.5">
                                                {validation.warnings.map((w, i) => (
                                                    <li key={i}>{w}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Original Input Provenance */}
                                    {validation.normalizedPayload.input?.content && (
                                        <div className="mt-4 rounded-xl border border-border-subtle bg-background p-3.5">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-faint">
                                                Original Message Source · {validation.normalizedPayload.input.source?.name || "College Notice"}
                                            </p>
                                            <p className="mt-1.5 text-[13px] text-foreground-secondary italic">
                                                &ldquo;{validation.normalizedPayload.input.content}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {/* Concise Counts Breakdown */}
                                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/50 p-3 text-center">
                                            <span className="text-2xl font-bold text-foreground">
                                                {validation.normalizedPayload.items?.filter((i) => i.type === "event").length || 0}
                                            </span>
                                            <p className="text-[11px] font-medium text-foreground-muted">Events</p>
                                        </div>
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/50 p-3 text-center">
                                            <span className="text-2xl font-bold text-foreground">
                                                {validation.normalizedPayload.items?.filter((i) => i.type === "action").length || 0}
                                            </span>
                                            <p className="text-[11px] font-medium text-foreground-muted">Actions</p>
                                        </div>
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/50 p-3 text-center">
                                            <span className="text-2xl font-bold text-foreground">
                                                {validation.normalizedPayload.materials?.length || 0}
                                            </span>
                                            <p className="text-[11px] font-medium text-foreground-muted">Materials</p>
                                        </div>
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/50 p-3 text-center">
                                            <span className="text-2xl font-bold text-foreground">
                                                {validation.normalizedPayload.subjects?.length || 0}
                                            </span>
                                            <p className="text-[11px] font-medium text-foreground-muted">Subjects</p>
                                        </div>
                                    </div>

                                    {/* Items List Preview */}
                                    <div className="mt-6 space-y-2.5">
                                        <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            Entities Created
                                        </p>

                                        {validation.normalizedPayload.items?.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start justify-between rounded-xl border border-border-subtle bg-background p-3.5 transition-colors"
                                            >
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted border border-border-subtle">
                                                            {item.type}
                                                        </span>
                                                        <span className="text-[14px] font-medium text-foreground">
                                                            {item.title}
                                                        </span>
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-[12.5px] text-foreground-muted">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right text-[12px] text-foreground-muted shrink-0">
                                                    {item.subject && <span className="font-medium text-foreground">{item.subject}</span>}
                                                    {item.startAt && (
                                                        <div className="text-[11px] text-foreground-faint">
                                                            {new Date(item.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {validation.normalizedPayload.materials?.map((mat, idx) => (
                                            <div
                                                key={`mat_${idx}`}
                                                className="flex items-start justify-between rounded-xl border border-border-subtle bg-background p-3.5"
                                            >
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted border border-border-subtle">
                                                            {mat.type}
                                                        </span>
                                                        <span className="text-[14px] font-medium text-foreground">
                                                            {mat.title}
                                                        </span>
                                                    </div>
                                                    {mat.description && (
                                                        <p className="text-[12.5px] text-foreground-muted">
                                                            {mat.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right text-[12px] text-foreground-muted shrink-0">
                                                    {mat.origin && <span className="text-[11px] capitalize">{mat.origin}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-8 flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
                                        <button
                                            onClick={() => setStep("input")}
                                            className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-subtle"
                                        >
                                            Back & Edit
                                        </button>
                                        <button
                                            onClick={handleConfirmImport}
                                            className="inline-flex items-center gap-2 rounded-xl bg-inverse px-5 py-2 text-[13px] font-medium text-inverse-foreground shadow-sm hover:opacity-90"
                                        >
                                            <span>Add to Studidex</span>
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
                                    Successfully Added to Studidex
                                </h2>
                                <p className="mt-1 text-[14px] text-foreground-muted">
                                    Your study dashboard has updated across all views.
                                </p>

                                <div className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-2 text-[12px]">
                                    {importSuccessCount.events > 0 && (
                                        <span className="rounded-lg bg-surface-subtle px-3 py-1 font-medium text-foreground">
                                            {importSuccessCount.events} Event{importSuccessCount.events > 1 ? "s" : ""}
                                        </span>
                                    )}
                                    {importSuccessCount.actions > 0 && (
                                        <span className="rounded-lg bg-surface-subtle px-3 py-1 font-medium text-foreground">
                                            {importSuccessCount.actions} Action{importSuccessCount.actions > 1 ? "s" : ""}
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
                                        onClick={() => {
                                            setJsonInput("");
                                            setValidation(null);
                                            setStep("input");
                                        }}
                                        className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-subtle"
                                    >
                                        Import Another
                                    </button>
                                    <button
                                        onClick={() => router.push("/")}
                                        className="inline-flex items-center gap-2 rounded-xl bg-inverse px-5 py-2 text-[13px] font-medium text-inverse-foreground hover:opacity-90"
                                    >
                                        <span>Go to Home</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
