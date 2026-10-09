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
    ClipboardCheck,
    Upload,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";

export function RememberAiFab() {
    const router = useRouter();
    const { state } = useStudidex();
    const profile = state.profile || { name: "Student", stage: "ug" };

    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<"remember" | "external">("external");
    const [message, setMessage] = useState("");
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [dispatchedPrompt, setDispatchedPrompt] = useState<string | null>(null);
    const [showClipboardModal, setShowClipboardModal] = useState(false);
    const [clipboardContent, setClipboardContent] = useState<string>("");
    const lastDismissedClipboardRef = useRef<string>("");

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus textarea when opening modal
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

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
        if (profile.minorSpecialization) {
            parts.push(`Minor / Generic Elective: ${profile.minorSpecialization}`);
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

    // Construct full AI prompt
    const generateAiPrompt = (userInput: string) => {
        const context = buildContextString();
        return `You are my personalized academic study assistant for Studidex.

### Student Academic Profile & Context:
- ${context}

### Material / Question / Task:
${userInput.trim()}

### Required Output Format:
Please format your response clearly. If this includes scheduled classes, deadlines, homework assignments, or syllabus modules:
1. Provide explicit titles, due dates/times, and subject labels matching my active papers above.
2. If suitable, provide a JSON block matching the Studidex import structure (with items, events, actions, or syllabus topics) so I can copy and import it into Studidex with one click.`;
    };

    // Submit handler
    const handleSubmit = async () => {
        if (!message.trim()) return;

        const promptText = generateAiPrompt(message);
        setDispatchedPrompt(promptText);

        // Try Web Share API if supported
        let sharedSuccessfully = false;
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title: "Studidex Academic Query",
                    text: promptText,
                });
                sharedSuccessfully = true;
            } catch (err) {
                // User may have cancelled or share wasn't allowed; fall back to clipboard copy
            }
        }

        if (!sharedSuccessfully) {
            try {
                await navigator.clipboard.writeText(promptText);
                setCopiedPrompt(true);
                setTimeout(() => setCopiedPrompt(false), 3000);
            } catch (err) {
                console.warn("Could not copy prompt to clipboard", err);
            }
        }
    };

    // Focus detection to inspect clipboard for returned AI response
    useEffect(() => {
        const inspectClipboard = async () => {
            // Only inspect if we have previously dispatched a prompt or user is active
            if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return;

            try {
                const text = await navigator.clipboard.readText();
                if (!text || text.trim().length < 25) return;

                const trimmed = text.trim();
                // Check that it's not the prompt we just copied, nor the one we just dismissed
                if (
                    trimmed !== dispatchedPrompt?.trim() &&
                    trimmed !== lastDismissedClipboardRef.current
                ) {
                    // Check if it has hallmarks of structured study response or JSON
                    const looksLikeAiResponse =
                        trimmed.includes("{") ||
                        trimmed.includes("###") ||
                        trimmed.includes("Exam") ||
                        trimmed.includes("Assignment") ||
                        trimmed.includes("Schedule") ||
                        trimmed.includes("Syllabus") ||
                        trimmed.includes("Topic") ||
                        trimmed.includes("Date:") ||
                        trimmed.includes("Due:");

                    if (looksLikeAiResponse) {
                        setClipboardContent(trimmed);
                        setShowClipboardModal(true);
                    }
                }
            } catch {
                // Clipboard read permission might not be granted; safely ignore
            }
        };

        const handleFocus = () => {
            inspectClipboard();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                inspectClipboard();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [dispatchedPrompt]);

    const handleImportClipboard = () => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("studidex_pending_import", clipboardContent);
        }
        setShowClipboardModal(false);
        setIsOpen(false);
        router.push("/add");
    };

    const handleDismissClipboard = () => {
        lastDismissedClipboardRef.current = clipboardContent;
        setShowClipboardModal(false);
    };

    const handleOpenManualAdd = () => {
        setIsOpen(false);
        router.push("/add");
    };

    return (
        <>
            {/* Floating Action Button (FAB) near bottom right */}
            <div className="fixed bottom-22 right-4 z-40 md:bottom-8 md:right-8">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-surface shadow-[0_10px_30px_rgb(0_0_0/0.25)] transition-shadow hover:shadow-[0_12px_35px_rgb(0_0_0/0.35)]"
                    aria-label="Open Remember AI Assistant & Quick Intake"
                >
                    {/* Glowing pulse ring */}
                    <span className="absolute -inset-0.5 rounded-2xl bg-foreground/20 blur-xs transition-opacity group-hover:opacity-100 opacity-60" />

                    <div className="relative flex items-center justify-center">
                        <Sparkles size={24} className="text-surface" />
                        <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-foreground shadow-xs">
                            <Plus size={11} strokeWidth={3} />
                        </span>
                    </div>
                </motion.button>
            </div>

            {/* AI Assistant Modal (ChatGPT-style drawer/dialog) */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                        />

                        {/* Modal Box */}
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
                                                Remember AI
                                            </h2>
                                            <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                                                Assistant
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-foreground-muted">
                                            Curriculum-aware academic notes & schedule intake
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
                                    Select Mode
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {/* Remember AI (Recommended) - Currently Disabled */}
                                    <div
                                        className="relative flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-subtle/40 p-3 opacity-60 cursor-not-allowed"
                                        title="Local Neural Engine under development"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-semibold text-[13px] text-foreground-muted">
                                                <Sparkles size={14} />
                                                <span>Remember AI</span>
                                            </div>
                                            <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-foreground-muted">
                                                Recommended
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-foreground-muted">
                                            Local neural model engine. Currently unavailable.
                                        </p>
                                    </div>

                                    {/* External AI - Active */}
                                    <button
                                        type="button"
                                        onClick={() => setMode("external")}
                                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                                            mode === "external"
                                                ? "border-foreground bg-surface shadow-2xs"
                                                : "border-border-subtle hover:border-border"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-semibold text-[13px] text-foreground">
                                                <Share2 size={14} />
                                                <span>External AI</span>
                                            </div>
                                            <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-green-700 dark:text-green-300">
                                                Active
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-foreground-muted">
                                            Injects academic context & prepares prompt for ChatGPT, Claude, etc.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Personalization Context Attached */}
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

                            {/* Message Area */}
                            <div className="mt-4 space-y-2">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                    Message / Academic Material
                                </label>
                                <textarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Paste class schedule notice, assignment instructions, syllabus units, or ask for study drills..."
                                    className="w-full rounded-xl border border-border bg-surface p-3 text-[13px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none resize-none leading-relaxed"
                                />

                                {/* Suggestion prompt chips */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
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

                            {/* Action Row */}
                            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-subtle pt-4">
                                {/* Shifted Manual Add / Import button */}
                                <button
                                    type="button"
                                    onClick={handleOpenManualAdd}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-[12.5px] font-medium text-foreground hover:bg-surface-subtle transition-colors"
                                >
                                    <Upload size={14} />
                                    <span>Manual Add / Import</span>
                                </button>

                                <div className="flex w-full sm:w-auto items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!message.trim()}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-semibold text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all disabled:opacity-40"
                                    >
                                        <Send size={14} />
                                        <span>Send to External AI</span>
                                    </button>
                                </div>
                            </div>

                            {/* Prompt Dispatched / Quick Launchers */}
                            {dispatchedPrompt && (
                                <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-3.5 space-y-2">
                                    <div className="flex items-center justify-between text-[12.5px] font-semibold text-green-700 dark:text-green-300">
                                        <div className="flex items-center gap-1.5">
                                            <Check size={14} />
                                            <span>
                                                {copiedPrompt
                                                    ? "Copied to clipboard!"
                                                    : "Prompt prepared with your curriculum!"}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11.5px] text-foreground-muted">
                                        Open your external AI model below, paste the prompt, and copy the response. When you return, Studidex will prompt to import it!
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <a
                                            href="https://chatgpt.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-surface-subtle"
                                        >
                                            <span>Open ChatGPT</span>
                                            <ExternalLink size={11} />
                                        </a>
                                        <a
                                            href="https://claude.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-surface-subtle"
                                        >
                                            <span>Open Claude</span>
                                            <ExternalLink size={11} />
                                        </a>
                                        <a
                                            href="https://gemini.google.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-surface-subtle"
                                        >
                                            <span>Open Gemini</span>
                                            <ExternalLink size={11} />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Clipboard Detection Prompt (Appears on focus return) */}
            <AnimatePresence>
                {showClipboardModal && (
                    <div className="fixed bottom-6 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="rounded-2xl border border-foreground/20 bg-surface p-4 shadow-2xl backdrop-blur-md space-y-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-surface">
                                        <Sparkles size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[13.5px] font-semibold text-foreground">
                                            AI Response Detected
                                        </h4>
                                        <p className="text-[11.5px] text-foreground-muted">
                                            Found academic content in your clipboard
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDismissClipboard}
                                    className="text-foreground-muted hover:text-foreground"
                                    aria-label="Dismiss clipboard import"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Preview Snippet */}
                            <div className="max-h-20 overflow-hidden rounded-xl border border-border-subtle bg-surface-subtle/50 p-2.5 text-[11.5px] text-foreground-muted font-mono line-clamp-3">
                                {clipboardContent}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleDismissClipboard}
                                    className="rounded-xl border border-border px-3 py-1.5 text-[12px] font-medium text-foreground-muted hover:text-foreground"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="button"
                                    onClick={handleImportClipboard}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-surface shadow-xs hover:opacity-90 transition-opacity"
                                >
                                    <span>Import into Studidex</span>
                                    <ArrowRight size={13} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
