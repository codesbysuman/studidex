// app/materials/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
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
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { categorizeMaterials, Material } from "@/lib/core";

export default function MaterialsPage() {
    const { state } = useStudidex();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Filter materials
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
                            {mat.type} · {mat.origin}
                        </span>

                        {subject && (
                            <span className="text-[11px] font-medium text-foreground-muted">
                                {subject.name}
                            </span>
                        )}
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
                        <span>Read reference</span>
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
            <div className="mx-auto max-w-4xl space-y-10">
                {/* Header */}
                <header className="border-b border-border-subtle pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Study Index & Learning Assets
                    </p>
                    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                                Materials
                            </h1>
                            <p className="mt-1 text-[14px] text-foreground-muted">
                                Your notes, official handouts, syllabi, past questions, and mock tests.
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search materials..."
                                className="w-full rounded-xl border border-border-subtle bg-surface py-2 pl-9 pr-3 text-[13px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Subject Filter Pills */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted mr-1">
                            Subjects:
                        </span>
                        <button
                            onClick={() => setSelectedSubjectId("all")}
                            className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
                                selectedSubjectId === "all"
                                    ? "bg-foreground text-surface"
                                    : "border border-border-subtle bg-surface text-foreground-muted hover:text-foreground"
                            }`}
                        >
                            All ({state.materials.length})
                        </button>
                        {state.subjects.map((s) => {
                            const count = state.materials.filter((m) => m.subjectId === s.id).length;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedSubjectId(s.id)}
                                    className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
                                        selectedSubjectId === s.id
                                            ? "bg-foreground text-surface"
                                            : "border border-border-subtle bg-surface text-foreground-muted hover:text-foreground"
                                    }`}
                                >
                                    {s.name} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted mr-1">
                            Format:
                        </span>
                        {[
                            { key: "all", label: "All Formats" },
                            { key: "your_notes", label: `Your Notes (${categories.yourNotes.length})` },
                            { key: "our_notes", label: `Handouts & Notes (${categories.ourNotes.length})` },
                            { key: "mock_test", label: `Mock Tests (${categories.mockTests.length})` },
                            { key: "pyq", label: `PYQs (${categories.pyqs.length})` },
                            { key: "syllabus", label: `Syllabus (${categories.syllabus.length})` },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                onClick={() => setSelectedCategory(cat.key)}
                                className={`rounded-lg px-2.5 py-0.5 text-[11.5px] font-medium transition-colors ${
                                    selectedCategory === cat.key
                                        ? "bg-inverse text-inverse-foreground"
                                        : "bg-surface-subtle text-foreground-muted hover:text-foreground"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* If a specific subject is picked, offer direct Subject Syllabus Hub Link */}
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

                {/* Materials Grid */}
                {filteredMaterials.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-12 text-center text-foreground-muted">
                        <p className="text-[14px]">No materials found matching your filter.</p>
                        <button
                            onClick={() => {
                                setSelectedSubjectId("all");
                                setSelectedCategory("all");
                                setSearchQuery("");
                            }}
                            className="mt-2 text-[12.5px] font-medium text-foreground underline"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {filteredMaterials.map(renderMaterialCard)}
                    </div>
                )}
            </div>
        </main>
    );
}
