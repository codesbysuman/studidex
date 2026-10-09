"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
    User,
    GraduationCap,
    BookOpen,
    Building2,
    MapPin,
    Layers,
    Languages,
    Check,
    Plus,
    Sparkles,
    Trash2,
    ArrowLeft,
    School,
    FileText,
    Award,
    Hash,
    CheckCircle2,
    Save,
} from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";
import { EducationStage, PaperCategory, AcademicPaper, UserProfile } from "@/lib/core";
import { CustomSelect } from "@/components/ui/custom-select";

const STAGE_CONFIGS: Record<
    EducationStage,
    {
        title: string;
        tagline: string;
        classLabel: string;
        classOptions: string[];
        examiningBodyLabel: string;
        examiningBodySuggestions: string[];
        specializationLabel: string;
        specializationPlaceholder: string;
    }
> = {
    school: {
        title: "School (Secondary)",
        tagline: "Middle & Secondary schooling (Classes 6–10)",
        classLabel: "Current Class / Standard",
        classOptions: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
        examiningBodyLabel: "Affiliated Education Board",
        examiningBodySuggestions: ["CBSE", "ICSE", "State Board (WBBSE / SSC / Matric)", "IB Middle Years", "Cambridge IGCSE"],
        specializationLabel: "Curriculum Track",
        specializationPlaceholder: "General Foundation / Standard Curriculum",
    },
    hs: {
        title: "Higher Secondary (HS)",
        tagline: "Senior Secondary (Classes 11–12 / 10+2)",
        classLabel: "Class / Year",
        classOptions: ["Class 11", "Class 12"],
        examiningBodyLabel: "Board / Council of Higher Secondary Education",
        examiningBodySuggestions: ["CBSE", "ISC", "State HS Council (WBCHSE / HSC)", "Karnataka PUC", "IB Diploma", "Cambridge A-Levels"],
        specializationLabel: "Academic Stream",
        specializationPlaceholder: "e.g. Science (PCM), Commerce, Humanities",
    },
    ug: {
        title: "Undergraduate (UG)",
        tagline: "Bachelor's Degree · CBCS / NEP Semester Papers",
        classLabel: "Semester / Year",
        classOptions: [
            "Semester 1",
            "Semester 2",
            "Semester 3",
            "Semester 4",
            "Semester 5",
            "Semester 6",
            "Semester 7",
            "Semester 8",
        ],
        examiningBodyLabel: "Affiliated Examining Body / University",
        examiningBodySuggestions: [
            "University of Calcutta",
            "University of Delhi",
            "Jadavpur University",
            "Mumbai University",
            "Autonomous College Board",
            "VTU",
            "State University Board",
            "Central University",
        ],
        specializationLabel: "Major / Core Honours Discipline",
        specializationPlaceholder: "e.g. Political Science, Computer Science, Economics",
    },
    pg: {
        title: "Postgraduate (PG)",
        tagline: "Master's Degree · Advanced Papers, Seminars & Research",
        classLabel: "Semester / Academic Year",
        classOptions: ["Semester 1", "Semester 2", "Semester 3", "Semester 4"],
        examiningBodyLabel: "Affiliated University / Institute",
        examiningBodySuggestions: [
            "University of Delhi",
            "Jawaharlal Nehru University",
            "Jadavpur University",
            "University of Calcutta",
            "IIT / NIT Board",
            "IISc / Central University",
            "State University Board",
        ],
        specializationLabel: "Department / Research Specialization",
        specializationPlaceholder: "e.g. International Relations, Machine Learning, Pure Mathematics",
    },
};

const HS_STREAM_OPTIONS = [
    "Science (PCM — Physics, Chemistry, Math)",
    "Science (PCB — Physics, Chemistry, Biology)",
    "Science (PCMB — Pure Science)",
    "Commerce (Accountancy, Business Studies, Economics)",
    "Humanities & Social Sciences",
    "Computer Science & Tech Stream",
    "Vocational & Applied Arts",
];

const UG_DEGREE_OPTIONS = [
    "B.A. (Hons)",
    "B.A. (General / Program)",
    "B.Sc (Hons)",
    "B.Sc (Computer Science / IT)",
    "B.Com (Hons)",
    "B.Tech / B.E.",
    "B.C.A.",
    "B.B.A.",
    "LL.B.",
    "B.Ed.",
    "Other Bachelor's Degree",
];

const PG_DEGREE_OPTIONS = [
    "M.A. (Master of Arts)",
    "M.Sc (Master of Science)",
    "M.Com (Master of Commerce)",
    "M.Tech / M.E.",
    "M.C.A.",
    "M.B.A.",
    "LL.M.",
    "Ph.D / Research",
    "Other Master's Degree",
];

const MEDIUM_OPTIONS = [
    "English",
    "Bengali",
    "Hindi",
    "Marathi",
    "Tamil",
    "Telugu",
    "Urdu",
    "Other / Regional",
];

const PAPER_CATEGORY_OPTIONS: { value: PaperCategory; label: string; desc: string }[] = [
    { value: "CC", label: "CC — Core Course", desc: "Foundational compulsory major paper" },
    { value: "DSE", label: "DSE — Discipline Specific Elective", desc: "Specialized departmental elective" },
    { value: "SEC", label: "SEC — Skill Enhancement Course", desc: "Applied practical skill paper (e.g. Panchayati Raj in Practice)" },
    { value: "GE", label: "GE — Generic Elective", desc: "Interdisciplinary elective from another subject" },
    { value: "AEC", label: "AEC — Ability Enhancement Course", desc: "Communicative language / Environmental studies" },
    { value: "Major", label: "Major Paper", desc: "NEP 4-year major core course" },
    { value: "Minor", label: "Minor Paper", desc: "NEP minor discipline paper" },
    { value: "Elective", label: "Elective / Special Paper", desc: "Elective course" },
    { value: "Other", label: "General Paper", desc: "Standard paper" },
];

export default function ProfileClient() {
    const { state, updateProfile } = useStudidex();
    const profile = state.profile || { name: "Student", stage: "ug" };

    // Initial stage detection
    const initialStage: EducationStage =
        profile.stage ||
        (profile.className?.toLowerCase().includes("semester")
            ? "ug"
            : profile.className === "Class 11" || profile.className === "Class 12"
            ? "hs"
            : profile.className?.toLowerCase().includes("class")
            ? "school"
            : "ug");

    const [stage, setStage] = useState<EducationStage>(initialStage);
    const [name, setName] = useState(profile.name || "Student");
    const [className, setClassName] = useState(profile.className || "Semester 3");
    const [examiningBody, setExaminingBody] = useState(
        profile.examiningBody || profile.board || "University of Calcutta"
    );
    const [institutionName, setInstitutionName] = useState(profile.institutionName || "");
    const [center, setCenter] = useState(profile.center || "");
    const [medium, setMedium] = useState(profile.medium || "English");
    const [degree, setDegree] = useState(profile.degree || "B.A. (Hons)");
    const [stream, setStream] = useState(profile.stream || "Humanities & Social Sciences");
    const [specialization, setSpecialization] = useState(
        profile.specialization || "Political Science"
    );
    const [minorSpecialization, setMinorSpecialization] = useState(
        profile.minorSpecialization || "Economics"
    );

    // Papers for UG & PG
    const [papers, setPapers] = useState<AcademicPaper[]>(profile.papers || []);
    const [newPaperName, setNewPaperName] = useState("");
    const [newPaperCode, setNewPaperCode] = useState("");
    const [newPaperCategory, setNewPaperCategory] = useState<PaperCategory>("CC");
    const [newPaperSemester, setNewPaperSemester] = useState("");

    // Standard subjects for School / HS
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
        profile.enrolledSubjectIds || []
    );
    const [customSubjectName, setCustomSubjectName] = useState("");
    const [additionalSubjects, setAdditionalSubjects] = useState<string[]>([]);

    const [saveSuccess, setSaveSuccess] = useState(false);

    // Sync on mount or when state profile changes
    useEffect(() => {
        if (state.profile) {
            const p = state.profile;
            setName(p.name || "Student");
            setStage(p.stage || initialStage);
            setClassName(p.className || (initialStage === "ug" ? "Semester 3" : "Class 12"));
            setExaminingBody(p.examiningBody || p.board || "");
            setInstitutionName(p.institutionName || "");
            setCenter(p.center || "");
            setMedium(p.medium || "English");
            setDegree(p.degree || "B.A. (Hons)");
            setStream(p.stream || "Humanities & Social Sciences");
            setSpecialization(p.specialization || "");
            setMinorSpecialization(p.minorSpecialization || "");
            setPapers(p.papers || []);
            setSelectedSubjectIds(p.enrolledSubjectIds || []);
        }
    }, [state.profile]);

    const stageConfig = STAGE_CONFIGS[stage];

    // Stage switch handler
    const handleStageChange = (newStage: EducationStage) => {
        setStage(newStage);
        if (newStage === "school") {
            setClassName("Class 10");
            setExaminingBody("CBSE");
        } else if (newStage === "hs") {
            setClassName("Class 12");
            setExaminingBody("CBSE");
            setStream("Science (PCM — Physics, Chemistry, Math)");
        } else if (newStage === "ug") {
            setClassName("Semester 3");
            setDegree("B.A. (Hons)");
            setExaminingBody("University of Calcutta");
            setSpecialization("Political Science");
        } else if (newStage === "pg") {
            setClassName("Semester 2");
            setDegree("M.A. (Master of Arts)");
            setExaminingBody("University of Delhi");
            setSpecialization("International Relations");
        }
    };

    // Add Paper for UG / PG
    const handleAddPaper = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newPaperName.trim();
        if (!trimmedName) return;

        const newPaper: AcademicPaper = {
            id: `paper_${Date.now()}`,
            name: trimmedName,
            code: newPaperCode.trim() || undefined,
            category: newPaperCategory,
            semester: newPaperSemester.trim() || className,
        };

        setPapers((prev) => [...prev, newPaper]);
        setNewPaperName("");
        setNewPaperCode("");
    };

    // Remove Paper
    const handleRemovePaper = (paperId: string) => {
        setPapers((prev) => prev.filter((p) => p.id !== paperId));
    };

    // Toggle regular subject
    const handleToggleSubject = (subjectId: string) => {
        setSelectedSubjectIds((prev) =>
            prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
        );
    };

    // Add custom subject
    const handleAddCustomSubject = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customSubjectName.trim();
        if (!trimmed) return;
        if (!additionalSubjects.includes(trimmed)) {
            setAdditionalSubjects((prev) => [...prev, trimmed]);
        }
        setCustomSubjectName("");
    };

    const handleSaveProfile = () => {
        const updatedProfile: Partial<UserProfile> = {
            name: name.trim() || "Student",
            stage,
            className,
            examiningBody: examiningBody.trim(),
            board: examiningBody.trim(),
            medium,
            institutionName: institutionName.trim(),
            center: center.trim(),
            degree: stage === "ug" || stage === "pg" ? degree : undefined,
            stream: stage === "hs" ? stream : stage === "school" ? "General Foundation" : specialization,
            specialization: stage === "ug" || stage === "pg" ? specialization.trim() : undefined,
            minorSpecialization: stage === "ug" ? minorSpecialization.trim() : undefined,
            papers: stage === "ug" || stage === "pg" ? papers : [],
            enrolledSubjectIds: selectedSubjectIds,
            hasCompletedOnboarding: true,
        };

        updateProfile(updatedProfile, additionalSubjects, papers);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
    };

    return (
        <main className="min-h-screen px-5 pb-36 pt-8 md:px-12 md:pb-20 md:pt-14">
            <div className="mx-auto max-w-4xl space-y-10">
                {/* Back / Navigation Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Daily Overview</span>
                    </Link>

                    {saveSuccess && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1 text-[12.5px] font-semibold text-green-700 dark:text-green-300 border border-green-500/20"
                        >
                            <CheckCircle2 size={15} />
                            <span>Academic profile saved!</span>
                        </motion.div>
                    )}
                </div>

                {/* Main Page Header */}
                <header className="border-b border-border-subtle pb-6 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                        Identity & Curriculum Configuration
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                                Academic Profile
                            </h1>
                            <p className="mt-1 text-[14px] text-foreground-muted">
                                Personalize your stage, examining university/board, papers, and specialized curriculum.
                            </p>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            className="inline-flex items-center gap-2 self-start rounded-xl bg-foreground px-5 py-2.5 text-[13px] font-medium text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all"
                        >
                            <Save size={15} />
                            <span>Save All Changes</span>
                        </button>
                    </div>
                </header>

                {/* Live Greeting & Badge Preview */}
                <section className="rounded-2xl border border-border-subtle bg-surface p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                            <Sparkles size={14} />
                            <span>Dashboard Header Preview</span>
                        </span>
                        <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                            {stage.toUpperCase()} Stage
                        </span>
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Hello, {name.trim() || "Student"} 👋
                        </h2>
                        <p className="text-[13px] text-foreground-muted">
                            {className} · {examiningBody || "Examining Body"} · {institutionName || "Institution"}
                            {center ? ` (${center})` : ""}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 text-[12px]">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1 text-foreground font-medium">
                            <GraduationCap size={13} />
                            <span>{stageConfig.title}</span>
                        </span>

                        {(specialization || stream) && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1 text-foreground font-medium">
                                <Layers size={13} />
                                <span>{stage === "ug" || stage === "pg" ? specialization : stream.split("—")[0].trim()}</span>
                            </span>
                        )}

                        {medium && (
                            <span className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-foreground-muted">
                                {medium} Medium
                            </span>
                        )}

                        {stage === "ug" || stage === "pg" ? (
                            <span className="rounded-lg bg-inverse text-inverse-foreground px-2.5 py-1 text-[11.5px] font-medium">
                                {papers.length} Papers Configured
                            </span>
                        ) : (
                            <span className="rounded-lg bg-surface-subtle text-foreground-muted px-2.5 py-1 text-[11.5px] font-medium">
                                {selectedSubjectIds.length + additionalSubjects.length} Subjects Enrolled
                            </span>
                        )}
                    </div>
                </section>

                {/* 1. STAGE SELECTOR (School, HS, UG, PG) */}
                <section className="space-y-3">
                    <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                        Select Academic Stage
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {(["school", "hs", "ug", "pg"] as EducationStage[]).map((stg) => {
                            const active = stage === stg;
                            const conf = STAGE_CONFIGS[stg];
                            return (
                                <button
                                    key={stg}
                                    type="button"
                                    onClick={() => handleStageChange(stg)}
                                    className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                                        active
                                            ? "border-foreground bg-surface shadow-xs"
                                            : "border-border-subtle bg-surface/60 hover:border-border hover:bg-surface"
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                                                {stg.toUpperCase()}
                                            </span>
                                            {active && <Check size={14} strokeWidth={2.5} className="text-foreground" />}
                                        </div>
                                        <h3 className="mt-1 text-[14px] font-semibold text-foreground">
                                            {conf.title.split("(")[0].trim()}
                                        </h3>
                                        <p className="mt-0.5 text-[11.5px] text-foreground-muted line-clamp-2">
                                            {conf.tagline}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 2. CORE IDENTITY & INSTITUTION */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                        <User size={18} className="text-foreground-muted" />
                        <h2 className="text-[15px] font-semibold text-foreground">
                            Personal & Institution Details
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {/* Name */}
                        <div>
                            <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                Student Name / Nickname
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your preferred name (e.g. Suman, Alex)"
                                className="w-full rounded-xl border border-border bg-surface py-2.5 px-3.5 text-[13.5px] text-foreground focus:border-foreground focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Class / Semester */}
                        <div>
                            <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                {stageConfig.classLabel}
                            </label>
                            <CustomSelect
                                value={className}
                                onChange={setClassName}
                                options={stageConfig.classOptions.map((opt) => ({
                                    value: opt,
                                    label: opt,
                                }))}
                            />
                        </div>

                        {/* Affiliated Examining Body (TYPEABLE with quick suggestion pills!) */}
                        <div className="sm:col-span-2 space-y-2">
                            <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                                {stageConfig.examiningBodyLabel} (Type custom or choose)
                            </label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
                                <input
                                    type="text"
                                    value={examiningBody}
                                    onChange={(e) => setExaminingBody(e.target.value)}
                                    placeholder="Type your university / board name (e.g. University of Calcutta, Delhi University, CBSE, WBCHSE)..."
                                    className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3.5 text-[13.5px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Suggestions pills */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] text-foreground-faint mr-1">Quick Suggestions:</span>
                                {stageConfig.examiningBodySuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setExaminingBody(suggestion)}
                                        className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                                            examiningBody.toLowerCase() === suggestion.toLowerCase()
                                                ? "border-foreground bg-foreground text-surface font-medium"
                                                : "border-border-subtle bg-surface-subtle text-foreground-muted hover:border-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Enrolled Institution & Center */}
                        <div>
                            <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                Enrolled Institution / College / Department
                            </label>
                            <input
                                type="text"
                                value={institutionName}
                                onChange={(e) => setInstitutionName(e.target.value)}
                                placeholder="e.g. Presidency University, Scottish Church College, Allen"
                                className="w-full rounded-xl border border-border bg-surface py-2.5 px-3.5 text-[13.5px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                Center / Campus / Branch Location
                            </label>
                            <input
                                type="text"
                                value={center}
                                onChange={(e) => setCenter(e.target.value)}
                                placeholder="e.g. College Street Campus, South Kolkata Branch, Main"
                                className="w-full rounded-xl border border-border bg-surface py-2.5 px-3.5 text-[13.5px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Medium of Instruction */}
                        <div>
                            <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                Medium of Instruction
                            </label>
                            <CustomSelect
                                value={medium}
                                onChange={setMedium}
                                options={MEDIUM_OPTIONS.map((m) => ({ value: m, label: m }))}
                            />
                        </div>
                    </div>
                </section>

                {/* 3. STAGE-SPECIFIC SPECIALIZATION */}
                <section className="rounded-2xl border border-border bg-surface p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                        <GraduationCap size={18} className="text-foreground-muted" />
                        <h2 className="text-[15px] font-semibold text-foreground">
                            {stageConfig.title} Specialization & Degree Details
                        </h2>
                    </div>

                    {/* SCHOOL SPECIALIZATION */}
                    {stage === "school" && (
                        <div className="space-y-3">
                            <p className="text-[13px] text-foreground-muted">
                                Standard foundational curriculum. Students study comprehensive core disciplines (Mathematics, Science, Social Sciences, Languages).
                            </p>
                        </div>
                    )}

                    {/* HS SPECIALIZATION */}
                    {stage === "hs" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                    Higher Secondary Stream / Track
                                </label>
                                <CustomSelect
                                    value={stream}
                                    onChange={setStream}
                                    options={HS_STREAM_OPTIONS.map((opt) => ({
                                        value: opt,
                                        label: opt,
                                    }))}
                                />
                            </div>
                        </div>
                    )}

                    {/* UG SPECIALIZATION */}
                    {stage === "ug" && (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                    Degree Program
                                </label>
                                <CustomSelect
                                    value={degree}
                                    onChange={setDegree}
                                    options={UG_DEGREE_OPTIONS.map((opt) => ({
                                        value: opt,
                                        label: opt,
                                    }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                    Major / Honours Discipline
                                </label>
                                <input
                                    type="text"
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    placeholder="e.g. Political Science, Computer Science, Economics"
                                    className="w-full rounded-xl border border-border bg-surface py-2.5 px-3.5 text-[13.5px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                    Minor / Generic Elective (GE) Discipline
                                </label>
                                <input
                                    type="text"
                                    value={minorSpecialization}
                                    onChange={(e) => setMinorSpecialization(e.target.value)}
                                    placeholder="e.g. Economics, Mathematics, Sociology, History"
                                    className="w-full rounded-xl border border-border bg-surface py-2.5 px-3.5 text-[13.5px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* PG SPECIALIZATION */}
                    {stage === "pg" && (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                    Postgraduate Degree
                                </label>
                                <CustomSelect
                                    value={degree}
                                    onChange={setDegree}
                                    options={PG_DEGREE_OPTIONS.map((opt) => ({
                                        value: opt,
                                        label: opt,
                                    }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold uppercase tracking-wider text-foreground-muted mb-1.5">
                                    Department / Field of Study
                                </label>
                                <input
                                    type="text"
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    placeholder="e.g. Political Science & Public Governance"
                                    className="w-full rounded-xl border border-border bg-surface py-2.5 px-3.5 text-[13.5px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* 4. PAPERS & CURRICULUM ARCHITECTURE (UG & PG PAPERS SYSTEM) */}
                {stage === "ug" || stage === "pg" ? (
                    <section className="rounded-2xl border border-border bg-surface p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border-subtle pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} className="text-foreground-muted" />
                                    <h2 className="text-[15px] font-semibold text-foreground">
                                        Semester Papers & Course Modules
                                    </h2>
                                </div>
                                <p className="mt-1 text-[12.5px] text-foreground-muted">
                                    Specify your exact papers (e.g. <em>SEC-1: Panchayati Raj in Practice</em>, <em>CC-5: Comparative Government</em>, <em>DSE</em>, <em>GE</em>) so materials and study items connect directly to them.
                                </p>
                            </div>
                            <span className="self-start rounded-full bg-surface-subtle px-3 py-1 text-[11.5px] font-semibold text-foreground">
                                {papers.length} Papers
                            </span>
                        </div>

                        {/* List of configured papers */}
                        {papers.length > 0 ? (
                            <div className="divide-y divide-border-subtle rounded-xl border border-border bg-surface overflow-hidden">
                                {papers.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between p-3.5 hover:bg-surface-subtle/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-foreground-muted border border-border-subtle">
                                                {p.category || "CC"}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-[14px] font-medium text-foreground">
                                                        {p.name}
                                                    </h3>
                                                    {p.code && (
                                                        <span className="font-mono text-[11px] text-foreground-muted">
                                                            [{p.code}]
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11.5px] text-foreground-muted">
                                                    {p.semester || className}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemovePaper(p.id)}
                                            className="rounded-lg p-1.5 text-foreground-muted hover:bg-red-500/10 hover:text-red-600 transition-colors"
                                            aria-label="Remove paper"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-border p-6 text-center text-foreground-muted text-[13px]">
                                No papers added yet. Add your specific semester papers (like SEC: Panchayati Raj in Practice) below!
                            </div>
                        )}

                        {/* Form to Add New Paper */}
                        <form
                            onSubmit={handleAddPaper}
                            className="rounded-xl border border-border-subtle bg-surface-subtle/30 p-4 space-y-4"
                        >
                            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-foreground">
                                + Add Paper / Course
                            </h3>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                <div className="sm:col-span-1">
                                    <label className="block text-[11px] font-semibold uppercase text-foreground-muted mb-1">
                                        Category / Type
                                    </label>
                                    <CustomSelect
                                        value={newPaperCategory}
                                        onChange={(val) => setNewPaperCategory(val as PaperCategory)}
                                        options={PAPER_CATEGORY_OPTIONS.map((c) => ({
                                            value: c.value,
                                            label: c.label,
                                            description: c.desc,
                                        }))}
                                    />
                                </div>

                                <div className="sm:col-span-1">
                                    <label className="block text-[11px] font-semibold uppercase text-foreground-muted mb-1">
                                        Paper Code (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newPaperCode}
                                        onChange={(e) => setNewPaperCode(e.target.value)}
                                        placeholder="e.g. POL-SEC-A-1"
                                        className="w-full rounded-xl border border-border bg-surface py-2 px-3 text-[12.5px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-semibold uppercase text-foreground-muted mb-1">
                                        Paper Title & Name
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newPaperName}
                                            onChange={(e) => setNewPaperName(e.target.value)}
                                            placeholder="e.g. SEC-1: Panchayati Raj in Practice"
                                            className="w-full rounded-xl border border-border bg-surface py-2 px-3 text-[12.5px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newPaperName.trim()}
                                            className="inline-flex items-center gap-1 rounded-xl bg-foreground px-4 py-2 text-[12.5px] font-medium text-surface disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                                        >
                                            <Plus size={14} />
                                            <span>Add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Presets Prompt for UG/PG papers */}
                            <div className="pt-1">
                                <p className="text-[11px] font-medium text-foreground-muted mb-1.5">
                                    Common Paper Examples:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { name: "SEC-1: Panchayati Raj in Practice", code: "POL-SEC-A1", cat: "SEC" as PaperCategory },
                                        { name: "CC-5: Comparative Government & Politics", code: "POL-CC-301", cat: "CC" as PaperCategory },
                                        { name: "CC-6: Perspectives on International Relations", code: "POL-CC-302", cat: "CC" as PaperCategory },
                                        { name: "GE-3: Principles of Macroeconomics", code: "ECO-GE-301", cat: "GE" as PaperCategory },
                                        { name: "DSE-1: Indian Foreign Policy in a Globalizing World", code: "POL-DSE-1", cat: "DSE" as PaperCategory },
                                    ].map((example) => (
                                        <button
                                            key={example.name}
                                            type="button"
                                            onClick={() => {
                                                setNewPaperName(example.name);
                                                setNewPaperCode(example.code);
                                                setNewPaperCategory(example.cat);
                                            }}
                                            className="rounded-md border border-dashed border-border-subtle bg-surface px-2 py-0.5 text-[11px] text-foreground-muted hover:border-foreground hover:text-foreground transition-colors"
                                        >
                                            + {example.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </section>
                ) : (
                    /* 4. SCHOOL & HS SUBJECT SELECTION */
                    <section className="rounded-2xl border border-border bg-surface p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                            <div className="flex items-center gap-2">
                                <BookOpen size={18} className="text-foreground-muted" />
                                <h2 className="text-[15px] font-semibold text-foreground">
                                    Enrolled Subjects
                                </h2>
                            </div>
                            <span className="text-[12px] text-foreground-muted">
                                {selectedSubjectIds.length + additionalSubjects.length} enrolled
                            </span>
                        </div>

                        {/* Existing subjects checkable pills */}
                        <div className="flex flex-wrap gap-2">
                            {state.subjects.map((s) => {
                                const selected = selectedSubjectIds.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleToggleSubject(s.id)}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                                            selected
                                                ? "bg-foreground text-surface"
                                                : "border border-border-subtle bg-surface text-foreground-muted hover:border-border hover:text-foreground"
                                        }`}
                                    >
                                        {selected && <Check size={13} strokeWidth={2.5} />}
                                        <span>{s.name}</span>
                                    </button>
                                );
                            })}

                            {additionalSubjects.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() =>
                                        setAdditionalSubjects((prev) => prev.filter((item) => item !== name))
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-surface px-3 py-1.5 text-[13px] font-medium"
                                >
                                    <Check size={13} strokeWidth={2.5} />
                                    <span>{name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Add Custom Subject */}
                        <form onSubmit={handleAddCustomSubject} className="flex gap-2 pt-2">
                            <input
                                type="text"
                                value={customSubjectName}
                                onChange={(e) => setCustomSubjectName(e.target.value)}
                                placeholder="Add subject (e.g. Physics, Chemistry, Biology, Sanskrit)..."
                                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!customSubjectName.trim()}
                                className="inline-flex items-center gap-1 rounded-xl bg-surface-subtle px-4 py-2 text-[12.5px] font-medium text-foreground hover:bg-foreground hover:text-surface disabled:opacity-40 transition-colors"
                            >
                                <Plus size={14} />
                                <span>Add</span>
                            </button>
                        </form>
                    </section>
                )}

                {/* Save Bottom Bar */}
                <div className="flex items-center justify-between border-t border-border-subtle pt-6">
                    <p className="text-[12px] text-foreground-muted">
                        Changes update your dashboard overview, timetable, and materials index immediately.
                    </p>

                    <button
                        onClick={handleSaveProfile}
                        className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-[13px] font-medium text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all"
                    >
                        <Save size={15} />
                        <span>Save Profile</span>
                    </button>
                </div>
            </div>
        </main>
    );
}
