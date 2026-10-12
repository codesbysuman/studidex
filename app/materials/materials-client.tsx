// app/materials/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    BookOpen,
    FileText,
    CheckSquare,
    HelpCircle,
    ArrowRight,
    Layers,
    GraduationCap,
    Clock,
    ChevronDown,
    X,
    Download,
    Globe,
    Sparkles,
    Lock,
    Plus,
    Check,
    ShieldCheck,
} from "lucide-react";
import { useStudidex, type AuthUser } from "@/lib/use-studidex";
import { categorizeMaterials, Material, type StudidexState } from "@/lib/core";
import { CustomSelect } from "@/components/ui/custom-select";

interface PublicMaterial {
    id: string;
    title: string;
    description?: string;
    type: string;
    origin: string;
    content?: string;
    testData?: any;
    metadata?: any;
    isPublic: boolean;
    isPaid: boolean;
    price: number;
    downloadCount: number;
    stage: string;
    board: string;
    subjectName: string;
    authorName: string;
    relevanceScore: number;
}

export default function MaterialsPage({
    initialUser,
    initialState,
    isDbConnected,
}: {
    initialUser?: AuthUser | null;
    initialState?: StudidexState | null;
    isDbConnected?: boolean;
} = {}) {
    const { state, addMaterial } = useStudidex({
        user: initialUser,
        state: initialState,
        isDbConnected,
    });

    const profile = state.profile || { name: "", stage: "ug" };
    const isAdmin = initialUser?.role === "admin";

    // View tab
    const [activeTab, setActiveTab] = useState<"library" | "discover">("library");

    // Local filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Public discovery state
    const [publicMaterials, setPublicMaterials] = useState<PublicMaterial[]>([]);
    const [loadingPublic, setLoadingPublic] = useState(false);
    const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Fetch public materials on discover tab switch
    useEffect(() => {
        if (activeTab === "discover" && publicMaterials.length === 0) {
            setLoadingPublic(true);
            const stageParam = profile.stage || "ug";
            const boardParam = profile.examiningBody || profile.board || "";
            fetch(`/api/materials/public?stage=${encodeURIComponent(stageParam)}&board=${encodeURIComponent(boardParam)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.materials) {
                        setPublicMaterials(data.materials);
                    }
                })
                .catch((e) => console.error("Error loading public materials:", e))
                .finally(() => setLoadingPublic(false));
        }
    }, [activeTab, profile.stage, profile.examiningBody, profile.board, publicMaterials.length]);

    // Handle instant download
    const handleDownloadMaterial = async (e: React.MouseEvent, mat: Material | PublicMaterial) => {
        e.preventDefault();
        e.stopPropagation();

        if (mat.isPaid) {
            showToast("This is a paid resource. Preview online or purchase to download.");
            return;
        }

        try {
            const res = await fetch(`/api/materials/${mat.id}/download`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Download failed");

            const blob = new Blob([data.content || mat.content || mat.description || ""], {
                type: "text/markdown;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = data.filename || `${mat.title.replace(/\s+/g, "_")}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`Downloaded "${mat.title}" successfully.`);
        } catch {
            showToast("Failed to download resource.");
        }
    };

    // Import public material into personal library
    const handleImportPublicMaterial = (pub: PublicMaterial) => {
        addMaterial({
            type: pub.type as any,
            title: pub.title,
            description: pub.description,
            origin: "college",
            content: pub.content,
            testData: pub.testData,
            metadata: {
                ...pub.metadata,
                author: pub.authorName,
                board: pub.board,
                stage: pub.stage,
                importedFromPublic: true,
            },
        });

        setImportedIds((prev) => new Set(prev).add(pub.id));
        showToast(`Saved "${pub.title}" to your study library!`);
    };

    // Filter local materials
    const filteredMaterials = state.materials.filter((m) => {
        if (selectedSubjectId !== "all" && m.subjectId !== selectedSubjectId) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = m.title.toLowerCase().includes(q);
            const matchDesc = m.description?.toLowerCase().includes(q);
            const matchContent = m.content?.toLowerCase().includes(q);
            if (!matchTitle && !matchDesc && !matchContent) return false;
        }
        if (selectedCategory !== "all") {
            if (selectedCategory === "your_notes" && m.origin !== "personal") return false;
            if (selectedCategory === "our_notes" && (m.origin === "personal" || m.type === "mock_test" || m.type === "pyq")) return false;
            if (selectedCategory === "mock_test" && m.type !== "mock_test") return false;
            if (selectedCategory === "pyq" && m.type !== "pyq") return false;
            if (selectedCategory === "syllabus" && m.type !== "syllabus") return false;
        }
        return true;
    });

    const categories = categorizeMaterials(
        selectedSubjectId === "all"
            ? state.materials
            : state.materials.filter((m) => m.subjectId === selectedSubjectId)
    );

    const renderMaterialCard = (mat: Material) => {
        const subject = state.subjects.find((s) => s.id === mat.subjectId);
        const isMock = mat.type === "mock_test";

        return (
            <Link
                key={mat.id}
                href={`/materials/${mat.id}`}
                className="group flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-4 transition-all hover:border-border hover:shadow-xs"
            >
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                            {mat.type === "mock_test"
                                ? "Practice Quiz"
                                : mat.type === "pyq"
                                ? "Past Paper"
                                : mat.type === "sample_paper"
                                ? "Sample Paper"
                                : mat.type === "syllabus"
                                ? "Syllabus"
                                : mat.type === "handout"
                                ? "Handout"
                                : mat.type === "reference"
                                ? "Reference"
                                : mat.type === "pdf" || mat.type === "document"
                                ? "Document"
                                : "Study Note"}{" "}
                            ·{" "}
                            {mat.origin === "personal"
                                ? "My Notes"
                                : mat.origin === "teacher"
                                ? "Faculty"
                                : mat.origin === "college"
                                ? "Dept"
                                : "Curated"}
                        </span>

                        <div className="flex items-center gap-2">
                            {subject && (
                                <span className="text-[11px] font-medium text-foreground-muted">
                                    {subject.name}
                                </span>
                            )}
                            {mat.isPaid ? (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    <Lock size={10} /> Paid
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <h3 className="mt-2 text-[15px] font-medium text-foreground group-hover:underline">
                        {mat.title}
                    </h3>

                    {mat.description && (
                        <p className="mt-1 text-[12.5px] text-foreground-muted line-clamp-2">
                            {mat.description}
                        </p>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-[12px] text-foreground-faint">
                    {isMock ? (
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Clock size={12} />
                            <span>{mat.testData?.durationMinutes} mins · {mat.testData?.totalMarks} marks</span>
                        </span>
                    ) : (
                        <div className="flex items-center gap-2">
                            {!mat.isPaid && (
                                <button
                                    type="button"
                                    onClick={(e) => handleDownloadMaterial(e, mat)}
                                    title="Download Markdown"
                                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-foreground-muted hover:bg-surface-subtle hover:text-foreground cursor-pointer transition-colors"
                                >
                                    <Download size={12} />
                                    <span>Download</span>
                                </button>
                            )}
                        </div>
                    )}

                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground group-hover:translate-x-0.5 transition-transform">
                        <span>{isMock ? "Start Test" : "Open"}</span>
                        <ArrowRight size={13} />
                    </span>
                </div>
            </Link>
        );
    };

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                                Knowledge & Materials
                            </span>
                            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                                Study Index & Resource Library
                            </h1>
                            <p className="mt-1 text-[14px] text-foreground-muted">
                                Course handouts, past exam papers, mock quizzes, and community-curated study files.
                            </p>
                        </div>

                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-surface-subtle shadow-xs"
                          >
                            <ShieldCheck size={14} />
                            <span>Admin Curation</span>
                          </Link>
                        )}
                    </div>

                    {/* Toast Alert */}
                    {toastMessage && (
                        <div className="rounded-xl border border-border bg-foreground text-surface px-4 py-2 text-[12.5px] font-medium shadow-md">
                            {toastMessage}
                        </div>
                    )}

                    {/* Tab Navigation: My Library vs Public Discovery */}
                    <div className="flex rounded-xl border border-border-subtle bg-surface-subtle/40 p-1 max-w-md">
                        <button
                            type="button"
                            onClick={() => setActiveTab("library")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium transition-all cursor-pointer ${
                                activeTab === "library"
                                    ? "bg-surface text-foreground shadow-2xs font-semibold"
                                    : "text-foreground-muted hover:text-foreground"
                            }`}
                        >
                            <BookOpen size={14} />
                            <span>My Library ({state.materials.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("discover")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium transition-all cursor-pointer ${
                                activeTab === "discover"
                                    ? "bg-surface text-foreground shadow-2xs font-semibold"
                                    : "text-foreground-muted hover:text-foreground"
                            }`}
                        >
                            <Globe size={14} />
                            <span>Public Discovery</span>
                            <span className="rounded-full bg-foreground px-1.5 py-0.2 text-[10px] text-surface font-bold">
                                Hub
                            </span>
                        </button>
                    </div>

                    {/* Filter Bar for My Library */}
                    {activeTab === "library" && (
                        <div className="space-y-3 pt-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search materials by title or content keywords..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-xl border border-border-subtle bg-surface px-9 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                <CustomSelect
                                    value={selectedSubjectId}
                                    onChange={setSelectedSubjectId}
                                    icon={<BookOpen size={14} />}
                                    className="sm:w-auto sm:min-w-44"
                                    options={[
                                        { value: "all", label: "All Subjects", badge: `${state.materials.length}` },
                                        ...state.subjects.map((s) => ({
                                            value: s.id,
                                            label: s.name,
                                            badge: `${state.materials.filter((m) => m.subjectId === s.id).length}`,
                                        })),
                                    ]}
                                />

                                <CustomSelect
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    icon={<Layers size={14} />}
                                    className="sm:w-auto sm:min-w-44"
                                    options={[
                                        { value: "all", label: "All Formats" },
                                        { value: "your_notes", label: "Your Notes", badge: `${categories.yourNotes.length}` },
                                        { value: "our_notes", label: "Handouts & Notes", badge: `${categories.ourNotes.length}` },
                                        { value: "mock_test", label: "Mock Tests", badge: `${categories.mockTests.length}` },
                                        { value: "pyq", label: "Past Papers (PYQs)", badge: `${categories.pyqs.length}` },
                                        { value: "syllabus", label: "Syllabi", badge: `${categories.syllabus.length}` },
                                    ]}
                                />
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 text-[12px] text-foreground-muted">
                                <span>
                                    Showing <strong className="text-foreground">{filteredMaterials.length}</strong> of {state.materials.length}
                                </span>

                                {(selectedSubjectId !== "all" || selectedCategory !== "all" || searchQuery.trim() !== "") && (
                                    <button
                                        onClick={() => {
                                            setSelectedSubjectId("all");
                                            setSelectedCategory("all");
                                            setSearchQuery("");
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg bg-surface-subtle px-2 py-1 text-[11.5px] font-medium text-foreground hover:bg-foreground hover:text-surface transition-colors cursor-pointer"
                                    >
                                        <X size={12} />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {/* ========================================================= */}
                {/* TAB 1: MY LIBRARY                                         */}
                {/* ========================================================= */}
                {activeTab === "library" && (
                    <>
                        {selectedSubjectId !== "all" && (
                            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-subtle/50 p-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                                        Dedicated Subject Space
                                    </p>
                                    <h2 className="text-[15px] font-medium text-foreground">
                                        View full syllabus, units & progress for{" "}
                                        {state.subjects.find((s) => s.id === selectedSubjectId)?.name}
                                    </h2>
                                </div>
                                <Link
                                    href={`/subjects/${selectedSubjectId}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-surface hover:opacity-90"
                                >
                                    <span>Subject View</span>
                                    <ArrowRight size={13} />
                                </Link>
                            </div>
                        )}

                        {filteredMaterials.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-foreground-muted space-y-3">
                                <p className="text-[14px]">No materials found in your personal library matching this filter.</p>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedSubjectId("all");
                                            setSelectedCategory("all");
                                            setSearchQuery("");
                                        }}
                                        className="text-[12.5px] font-medium text-foreground underline cursor-pointer"
                                    >
                                        Reset filters
                                    </button>
                                    <span className="text-foreground-faint">·</span>
                                    <button
                                        onClick={() => setActiveTab("discover")}
                                        className="text-[12.5px] font-medium text-foreground underline cursor-pointer"
                                    >
                                        Explore Public Discovery Hub →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {filteredMaterials.map(renderMaterialCard)}
                            </div>
                        )}
                    </>
                )}

                {/* ========================================================= */}
                {/* TAB 2: PUBLIC DISCOVERY & COMMUNITY                       */}
                {/* ========================================================= */}
                {activeTab === "discover" && (
                    <div className="space-y-6">
                        {/* Personalization Context Banner */}
                        <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-semibold text-surface">
                                    <Sparkles size={11} /> Personalized For You
                                </span>
                                <span className="text-[12px] font-medium text-foreground-muted">
                                    Curated across verified teachers and students
                                </span>
                            </div>
                            <h2 className="text-[17px] font-semibold text-foreground">
                                Recommended for: {profile.stage ? profile.stage.toUpperCase() : "UG"} · {profile.examiningBody || profile.board || "Your Board/University"}
                            </h2>
                            <p className="text-[13px] text-foreground-muted">
                                Public notes and previous papers selected by the academic admin. Non-paid resources can be downloaded directly or added to your private study workspace.
                            </p>
                        </div>

                        {loadingPublic ? (
                            <div className="p-12 text-center text-foreground-muted space-y-2">
                                <p className="text-[14px]">Searching curated public repository...</p>
                            </div>
                        ) : publicMaterials.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-foreground-muted space-y-2">
                                <p className="text-[14px]">No public materials published yet for your academic stage.</p>
                                <p className="text-[12px]">
                                    When administrators approve and mark synced resources as public, they will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {publicMaterials.map((pub) => {
                                    const isSaved = importedIds.has(pub.id) || state.materials.some((m) => m.title === pub.title);

                                    return (
                                        <div
                                            key={pub.id}
                                            className="group flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-5 transition-all hover:border-border hover:shadow-xs space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="rounded bg-surface-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                                                        {pub.type} · {pub.stage}
                                                    </span>

                                                    {pub.isPaid ? (
                                                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                                            <Lock size={11} /> Paid (${pub.price.toFixed(2)})
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-300">
                                                            Free Resource
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-[15.5px] font-semibold text-foreground tracking-tight">
                                                    {pub.title}
                                                </h3>

                                                {pub.description && (
                                                    <p className="text-[12.5px] text-foreground-muted line-clamp-2">
                                                        {pub.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11.5px] text-foreground-faint">
                                                    <span>Subject: <strong>{pub.subjectName}</strong></span>
                                                    <span>·</span>
                                                    <span>Board: {pub.board}</span>
                                                    <span>·</span>
                                                    <span>{pub.downloadCount} downloads</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-[12px]">
                                                {/* Download Button if free */}
                                                {!pub.isPaid ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDownloadMaterial(e, pub)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-surface-subtle cursor-pointer transition-colors"
                                                    >
                                                        <Download size={13} />
                                                        <span>Download (.md)</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[11.5px] text-foreground-muted italic">
                                                        Paid Resource
                                                    </span>
                                                )}

                                                {/* Add to Study Workspace */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleImportPublicMaterial(pub)}
                                                    disabled={isSaved}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-all cursor-pointer ${
                                                        isSaved
                                                            ? "bg-surface-subtle text-foreground-muted cursor-default"
                                                            : "bg-foreground text-surface hover:opacity-90 shadow-2xs active:scale-98"
                                                    }`}
                                                >
                                                    {isSaved ? (
                                                        <>
                                                            <Check size={13} />
                                                            <span>In Library</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={13} />
                                                            <span>Add to Index</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
