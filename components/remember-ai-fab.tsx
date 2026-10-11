// components/remember-ai-fab.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    Sparkles,
    Plus,
    X,
    Send,
    Share2,
    Copy,
    Check,
    ExternalLink,
    FileText,
    Bot,
    ArrowRight,
    AlertCircle,
    Calendar,
    CheckSquare,
    BookOpen,
    Loader2,
    RefreshCw,
    Upload,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { validateImportJson } from "@/lib/core/validate";

export function RememberAiFab() {
    const router = useRouter();
    const { state, importEnvelope } = useStudidex();
    const profile = state.profile || { name: "Student", stage: "ug" };

    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<"groq" | "external">("groq");
    const [message, setMessage] = useState("");
    const [externalResponse, setExternalResponse] = useState("");
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Staged preview for review before adding to user space
    const [previewEnvelope, setPreviewEnvelope] = useState<any | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus textarea when opening modal
    useEffect(() => {
        if (isOpen && textareaRef.current && !previewEnvelope) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen, previewEnvelope]);

    // Build curriculum personalization context
    const buildContextString = () => {
        const parts: string[] = [];
        if (profile.name) parts.push(`Student: ${profile.name}`);
        if (profile.stage) parts.push(`Education Stage: ${profile.stage.toUpperCase()}`);
        if (profile.className) parts.push(`Current Level / Semester: ${profile.className}`);
        if (profile.examiningBody || profile.board) {
            parts.push(`Board / Examining University: ${profile.examiningBody || profile.board}`);
        }
        if (profile.institutionName) parts.push(`Institution: ${profile.institutionName}`);
        if (profile.specialization || profile.stream) {
            parts.push(`Specialization / Stream: ${profile.specialization || profile.stream}`);
        }
        if (profile.papers && profile.papers.length > 0) {
            const paperList = profile.papers
                .map((p) => `${p.name} [${p.category || "Paper"}${p.code ? ` - ${p.code}` : ""}]`)
                .join(", ");
            parts.push(`Active Papers: ${paperList}`);
        } else if (profile.enrolledSubjectIds && profile.enrolledSubjectIds.length > 0) {
            const subNames = profile.enrolledSubjectIds
                .map((id) => state.subjects.find((s) => s.id === id)?.name || id)
                .join(", ");
            parts.push(`Enrolled Subjects: ${subNames}`);
        }
        return parts.join("\n- ");
    };

    // Construct external AI prompt
    const generateAiPrompt = (userInput: string) => {
        const context = buildContextString();
        return `You are my personalized academic study assistant for Studidex.

### Student Academic Profile & Context:
- ${context}

### Material / Notice / Task:
${userInput.trim()}

### Required Output Format:
Please format your response as strict JSON matching the Studidex format:
{
  "version": 1,
  "subjects": [{ "name": "Subject Name", "code": "Code if known" }],
  "topics": [{ "name": "Topic Name", "subject": "Subject Name", "unit": "Unit" }],
  "items": [
    {
      "type": "event | action | update | opportunity",
      "eventType": "class | exam | test | deadline",
      "actionType": "assignment | study | preparation",
      "title": "Title",
      "subject": "Subject Name",
      "startAt": "ISO date",
      "dueAt": "ISO date",
      "priority": "high | normal"
    }
  ],
  "materials": [
    {
      "type": "note | handout | syllabus",
      "title": "Title",
      "subject": "Subject Name",
      "content": "Notes or content"
    }
  ]
}`;
    };

    // Mode 1: Real AI compile via Groq API
    const handleProcessWithGroq = async () => {
        if (!message.trim()) return;
        setLoading(true);
        setError(null);
        setImportSuccess(null);

        try {
            const context = buildContextString();
            const res = await fetch("/api/ai/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input: message.trim(),
                    profileContext: context,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Unable to organize your input right now. Please try again or paste details into Quick Add.");
            }

            const payload = data.normalizedPayload || data.raw;
            setPreviewEnvelope(payload);
        } catch (err: any) {
            setError(err?.message || "Something went wrong while organizing your study notes.");
        } finally {
            setLoading(false);
        }
    };

    // Mode 2: Copy External Prompt
    const handleCopyExternalPrompt = () => {
        if (!message.trim()) return;
        const prompt = generateAiPrompt(message);
        navigator.clipboard.writeText(prompt);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 3000);
    };

    // Parse pasted response from External AI (ChatGPT/Claude)
    const handleParseExternalResponse = () => {
        if (!externalResponse.trim()) return;
        setError(null);

        try {
            const validation = validateImportJson(externalResponse);
            if (validation.valid && validation.normalizedPayload) {
                setPreviewEnvelope(validation.normalizedPayload);
            } else {
                // If wrapped in markdown, try extract
                const jsonMatch = externalResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const extractedValidation = validateImportJson(jsonMatch[0]);
                    if (extractedValidation.valid && extractedValidation.normalizedPayload) {
                        setPreviewEnvelope(extractedValidation.normalizedPayload);
                        return;
                    }
                }
                setError(
                    validation.errors.join(", ") ||
                        "Could not parse valid Studidex JSON from response. Please ensure valid JSON was returned."
                );
            }
        } catch {
            setError("Invalid JSON format. Please check the response text.");
        }
    };

    // Confirm and Import staged envelope
    const handleConfirmImport = () => {
        if (!previewEnvelope) return;

        try {
            const res = importEnvelope(previewEnvelope);
            const events = res.newItems.filter((i) => i.type === "event").length;
            const actions = res.newItems.filter((i) => i.type === "action").length;
            const mats = res.newMaterials.length;

            setImportSuccess(
                `Successfully imported ${events} event${events === 1 ? "" : "s"}, ${actions} task${actions === 1 ? "" : "s"}, and ${mats} material${mats === 1 ? "" : "s"}!`
            );
            setPreviewEnvelope(null);
            setMessage("");
            setExternalResponse("");

            setTimeout(() => {
                setIsOpen(false);
                setImportSuccess(null);
            }, 1800);
        } catch (err: any) {
            setError(err?.message || "Failed to save into your study space.");
        }
    };

    return (
        <>
            {/* Floating Action Button (FAB) */}
            <div className="fixed bottom-22 right-4 z-40 md:bottom-8 md:right-8">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setIsOpen((prev) => !prev);
                        setError(null);
                    }}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-surface shadow-[0_10px_30px_rgb(0_0_0/0.25)] transition-shadow hover:shadow-[0_12px_35px_rgb(0_0_0/0.35)]"
                    aria-label="Open Remember AI Assistant"
                >
                    <span className="absolute -inset-0.5 rounded-2xl bg-foreground/20 blur-xs transition-opacity group-hover:opacity-100 opacity-60" />

                    <div className="relative flex items-center justify-center">
                        <Sparkles size={24} className="text-surface" />
                        <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-foreground shadow-xs">
                            <Plus size={11} strokeWidth={3} />
                        </span>
                    </div>
                </motion.button>
            </div>

            {/* AI Assistant Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 25, scale: 0.97 }}
                            transition={{ type: "spring", damping: 28, stiffness: 350 }}
                            className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xl overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-surface">
                                        <Bot size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[16px] font-semibold text-foreground">
                                                Smart Intake Assistant
                                            </h2>
                                            <span className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-300">
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-foreground-muted">
                                            Turn notices, circulars, and notes into organized study tasks and exams
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-subtle hover:text-foreground transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Mode Selection */}
                            <div className="mt-4 space-y-2">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                    How would you like to add?
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {/* Instant Smart Intake */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode("groq");
                                            setError(null);
                                        }}
                                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                            mode === "groq"
                                                ? "border-foreground bg-surface shadow-2xs"
                                                : "border-border-subtle hover:border-border"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-semibold text-[13px] text-foreground">
                                                <Sparkles size={14} />
                                                <span>Instant Assistant</span>
                                            </div>
                                            <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-foreground">
                                                Automatic
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-foreground-muted">
                                            Auto-detects exams, deadlines, homework, and notes in 1 click.
                                        </p>
                                    </button>

                                    {/* External AI (Copy-Paste) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode("external");
                                            setError(null);
                                        }}
                                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                            mode === "external"
                                                ? "border-foreground bg-surface shadow-2xs"
                                                : "border-border-subtle hover:border-border"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-semibold text-[13px] text-foreground">
                                                <Share2 size={14} />
                                                <span>Prompt for ChatGPT</span>
                                            </div>
                                            <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-foreground-muted">
                                                Copy & Paste
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-foreground-muted">
                                            Copy a prepared prompt for ChatGPT, Claude, or Gemini.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Academic Profile Context Banner */}
                            <div className="mt-3.5 rounded-xl border border-border-subtle bg-surface-subtle/30 px-3.5 py-2.5 text-[12px]">
                                <div className="flex items-center justify-between text-foreground-muted">
                                    <span className="font-medium">Attached Academic Context:</span>
                                    <span className="font-semibold text-foreground">
                                        {profile.name || "Student"} · {profile.stage?.toUpperCase() || "UG"}
                                    </span>
                                </div>
                                <p className="mt-1 text-[11.5px] text-foreground-muted truncate">
                                    {profile.examiningBody || profile.board || "University"} ·{" "}
                                    {profile.specialization || profile.stream || "General"} ·{" "}
                                    {profile.papers?.length
                                        ? `${profile.papers.length} Papers Active`
                                        : `${profile.enrolledSubjectIds?.length || 0} Subjects`}
                                </p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[12.5px] text-red-600 dark:text-red-400">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Success Toast */}
                            {importSuccess && (
                                <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-[12.5px] text-green-700 dark:text-green-300">
                                    <Check size={16} />
                                    <span>{importSuccess}</span>
                                </div>
                            )}

                            {/* Main Input Area */}
                            {!previewEnvelope && (
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                            {mode === "groq"
                                                ? "Paste Notice, Message, or Task Details"
                                                : "Prompt Details"}
                                        </label>
                                        <textarea
                                            ref={textareaRef}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={4}
                                            placeholder="Paste class schedule notice, exam circular, homework brief, or syllabus module..."
                                            className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-[13px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none resize-none leading-relaxed"
                                        />

                                        {/* Suggestion prompt chips */}
                                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                                            {[
                                                "📅 Convert lecture schedule",
                                                "📝 Break assignment into steps",
                                                "🎯 5 mock exam questions",
                                                "📚 Syllabus topic summary",
                                            ].map((chip) => (
                                                <button
                                                    key={chip}
                                                    type="button"
                                                    onClick={() => setMessage(chip.slice(2).trim())}
                                                    className="rounded-lg border border-border-subtle bg-surface-subtle/40 px-2 py-1 text-[11px] text-foreground-muted hover:border-foreground/30 hover:text-foreground transition-colors"
                                                >
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Row for Mode 1 (Instant) */}
                                    {mode === "groq" && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-subtle pt-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    router.push("/add");
                                                }}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-[12.5px] font-medium text-foreground hover:bg-surface-subtle"
                                            >
                                                <Upload size={14} />
                                                <span>Go to Add Studies</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleProcessWithGroq}
                                                disabled={!message.trim() || loading}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-semibold text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all disabled:opacity-40"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        <span>Organizing with Assistant...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={14} />
                                                        <span>Organize & Preview</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Action Row & Paste Box for Mode 2 (External AI) */}
                                    {mode === "external" && (
                                        <div className="space-y-4 border-t border-border-subtle pt-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleCopyExternalPrompt}
                                                    disabled={!message.trim()}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-[12.5px] font-semibold text-surface shadow-xs hover:opacity-90 disabled:opacity-40"
                                                >
                                                    {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                                                    <span>{copiedPrompt ? "Prompt Copied!" : "Copy Formatted Prompt"}</span>
                                                </button>

                                                <div className="flex items-center gap-2 text-[11.5px]">
                                                    <a
                                                        href="https://chatgpt.com"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-foreground-muted hover:text-foreground"
                                                    >
                                                        <span>ChatGPT</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                    <a
                                                        href="https://claude.ai"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-foreground-muted hover:text-foreground"
                                                    >
                                                        <span>Claude</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Paste back response box */}
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                                    Paste response from ChatGPT or Claude:
                                                </label>
                                                <textarea
                                                    value={externalResponse}
                                                    onChange={(e) => setExternalResponse(e.target.value)}
                                                    rows={3}
                                                    placeholder="Paste the response from ChatGPT or Claude here..."
                                                    className="w-full rounded-xl border border-border bg-surface p-2.5 text-[12.5px] text-foreground font-mono focus:border-foreground focus:outline-none resize-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleParseExternalResponse}
                                                    disabled={!externalResponse.trim()}
                                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-foreground bg-surface py-2 text-[12.5px] font-semibold text-foreground hover:bg-surface-subtle disabled:opacity-40"
                                                >
                                                    <CheckSquare size={14} />
                                                    <span>Preview & Add Items</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Staged Preview Screen before Import */}
                            {previewEnvelope && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 space-y-4"
                                >
                                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                                        <div>
                                            <h3 className="text-[14px] font-semibold text-foreground">
                                                Review Items to Add
                                            </h3>
                                            <p className="text-[11.5px] text-foreground-muted">
                                                Review your tasks, exams, and notes before adding them to your schedule
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewEnvelope(null)}
                                            className="text-[11.5px] text-foreground-muted hover:text-foreground underline"
                                        >
                                            Edit input
                                        </button>
                                    </div>

                                    {/* Items List */}
                                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                                        {previewEnvelope.items?.map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-2.5 text-[12.5px]"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-semibold text-foreground">
                                                        {item.title}
                                                    </span>
                                                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted border border-border-subtle">
                                                        {item.eventType || item.actionType || item.type}
                                                    </span>
                                                </div>
                                                {item.description && (
                                                    <p className="mt-1 text-[11.5px] text-foreground-muted line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-faint">
                                                    {item.subject && <span>Subject: {item.subject}</span>}
                                                    {item.startAt && (
                                                        <span>Date: {new Date(item.startAt).toLocaleDateString()}</span>
                                                    )}
                                                    {item.dueAt && (
                                                        <span>Due: {new Date(item.dueAt).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {previewEnvelope.materials?.map((mat: any, idx: number) => (
                                            <div
                                                key={`mat-${idx}`}
                                                className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-2.5 text-[12.5px]"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-semibold text-foreground">
                                                        {mat.title}
                                                    </span>
                                                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted border border-border-subtle">
                                                        {mat.type === "note" ? "Study Note" : mat.type === "handout" ? "Class Handout" : mat.type === "syllabus" ? "Syllabus Guide" : "Reference Material"}
                                                    </span>
                                                </div>
                                                {mat.content && (
                                                    <p className="mt-1 text-[11.5px] text-foreground-muted line-clamp-2">
                                                        {mat.content}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Confirm buttons */}
                                    <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewEnvelope(null)}
                                            className="rounded-xl border border-border px-3.5 py-2 text-[12.5px] font-medium text-foreground-muted hover:text-foreground"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmImport}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-2 text-[12.5px] font-semibold text-surface shadow-xs hover:opacity-90"
                                        >
                                            <Check size={14} />
                                            <span>Add to My Schedule</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
