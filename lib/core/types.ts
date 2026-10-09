// lib/core/types.ts

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string; // ISO string

export type SubjectId = ID;
export type TopicId = ID;
export type InputId = ID;
export type ItemId = ID;
export type MaterialId = ID;

export type SourceType =
    | "whatsapp"
    | "college"
    | "department"
    | "teacher"
    | "university"
    | "school"
    | "board"
    | "user"
    | "web"
    | "library"
    | "other";

export type InputType =
    | "text"
    | "message"
    | "image"
    | "pdf"
    | "document"
    | "file"
    | "link";

export type ItemType =
    | "event"
    | "action"
    | "update"
    | "opportunity";

export type EventType =
    | "class"
    | "exam"
    | "test"
    | "deadline"
    | "holiday"
    | "submission"
    | "meeting"
    | "other";

export type ActionType =
    | "assignment"
    | "study"
    | "submission"
    | "application"
    | "preparation"
    | "practice"
    | "other";

export type UpdateType =
    | "notice"
    | "change"
    | "announcement"
    | "information"
    | "other";

export type OpportunityType =
    | "scholarship"
    | "competition"
    | "internship"
    | "fellowship"
    | "admission"
    | "other";

export type MaterialType =
    | "note"
    | "pdf"
    | "document"
    | "syllabus"
    | "pyq"
    | "mock_test"
    | "sample_paper"
    | "handout"
    | "reference"
    | "link"
    | "image"
    | "other";

export type MaterialOrigin =
    | "personal"
    | "college"
    | "teacher"
    | "library"
    | "community"
    | "web"
    | "system";

export type Priority =
    | "low"
    | "normal"
    | "high"
    | "urgent";

export type Status =
    | "active"
    | "completed"
    | "cancelled"
    | "archived";

export type Visibility =
    | "private"
    | "shared"
    | "public";

// ==========================================
// Canonical Core Entities
// ==========================================

export type EducationStage = "school" | "hs" | "ug" | "pg";

export type PaperCategory =
    | "CC"      // Core Course
    | "DSE"     // Discipline Specific Elective
    | "SEC"     // Skill Enhancement Course (e.g. SEC-Panchayati Raj in Practice)
    | "GE"      // Generic Elective
    | "AEC"     // Ability Enhancement Course
    | "Major"   // Major Paper
    | "Minor"   // Minor Paper
    | "Elective"// Elective Paper
    | "General" // General Paper
    | "Other";

export interface AcademicPaper {
    id: string;
    name: string;
    code?: string;
    category?: PaperCategory;
    semester?: string;
    credits?: number;
    subjectId?: SubjectId;
}

export interface Subject {
    id: SubjectId;
    name: string;
    code?: string;
    description?: string;
    createdAt?: ISODateTime;
    paperCategory?: PaperCategory;
    paperTitle?: string;
    semester?: string;
    credits?: number;
}

export interface Topic {
    id: TopicId;
    subjectId: SubjectId;
    name: string;
    unit?: string; // e.g. "Unit 1", "Chapter 2"
    description?: string;
    order?: number;
    progressPercent?: number; // 0 - 100
}

export interface InputProvenance {
    id: InputId;
    type: InputType;
    source: {
        type: SourceType;
        name?: string;
    };
    content: string;
    createdAt: ISODateTime;
    metadata?: Record<string, unknown>;
}

export interface AcademicItem {
    id: ItemId;
    type: ItemType;
    title: string;
    description?: string;
    subjectId?: SubjectId;
    topicIds?: TopicId[];
    inputId?: InputId;

    // Time fields
    startAt?: ISODateTime;
    endAt?: ISODateTime;
    dueAt?: ISODateTime;

    priority: Priority;
    status: Status;
    completedAt?: ISODateTime;

    // Specialization sub-types
    eventType?: EventType;
    actionType?: ActionType;
    updateType?: UpdateType;
    opportunityType?: OpportunityType;

    // Relationships
    preparesForItemId?: ItemId; // e.g. Preparation action -> Exam Event
    supersedesItemId?: ItemId;  // e.g. Schedule Change Update -> Old Event
    relatedItemIds?: ItemId[];

    // Context metadata (e.g. room, marks, units, changeDiff)
    metadata?: {
        room?: string;
        marks?: number | string;
        units?: string;
        changeDiff?: {
            from?: string;
            to?: string;
        };
        link?: string;
        amount?: string;
        eligibility?: string;
        checklist?: Array<{ id: string; text: string; done: boolean }>;
        [key: string]: unknown;
    };
}

export interface MockTestQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
    marks: number;
}

export interface MockTestData {
    durationMinutes: number;
    totalMarks: number;
    questions: MockTestQuestion[];
}

export interface MockTestAttempt {
    id: string;
    timestamp: ISODateTime;
    score: number;
    totalMarks: number;
    selectedAnswers: Record<string, number>; // questionId -> optionIndex
    timeSpentSeconds?: number;
}

export interface Material {
    id: MaterialId;
    type: MaterialType;
    title: string;
    description?: string;
    subjectId?: SubjectId;
    topicIds?: TopicId[];
    inputId?: InputId;
    origin: MaterialOrigin;
    content?: string; // Text content or rich notes
    url?: string;
    testData?: MockTestData;
    userProgress?: {
        completed?: boolean;
        lastAttemptScore?: number;
        totalMarks?: number;
        attempts?: MockTestAttempt[];
        notes?: string;
    };
    metadata?: {
        year?: string;
        term?: string;
        unit?: string;
        author?: string;
        fileSize?: string;
        [key: string]: unknown;
    };
}

export interface UserProfile {
    name: string;
    stage?: EducationStage; // "school" | "hs" | "ug" | "pg"
    className?: string; // Class / Grade / Semester (e.g. Class 10, Class 12, Semester 3)
    examiningBody?: string; // Typeable affiliated examining body or university name (e.g. "University of Calcutta", "Delhi University", "CBSE")
    board?: string; // Backwards-compatible alias for examiningBody
    medium?: string; // Medium of instruction (e.g. English, Bengali, Hindi)
    institutionName?: string; // Enrolled school / college / university / department / coaching name
    center?: string; // Center, branch or campus location
    degree?: string; // e.g. "B.A. (Hons)", "B.Sc", "B.Tech", "M.A.", "M.Sc"
    stream?: string; // For HS/School: Science, Commerce, Humanities. For UG/PG: Discipline cluster
    specialization?: string; // Major / Honours / Department / Track (e.g. "Political Science", "Artificial Intelligence")
    minorSpecialization?: string; // Minor / Generic Elective (e.g. "Economics")
    enrolledSubjectIds?: string[];
    papers?: AcademicPaper[]; // Detailed paper-level specifications for UG/PG (e.g. SEC-Panchayati Raj in Practice)
    customSubjects?: string[];
    hasCompletedOnboarding?: boolean;
}

export interface StudidexState {
    version: number;
    profile: UserProfile;
    subjects: Subject[];
    topics: Topic[];
    inputs: InputProvenance[];
    items: AcademicItem[];
    materials: Material[];
    lastUpdated: ISODateTime;
}

// ==========================================
// External AI JSON Schema Types (Section 7)
// ==========================================

export interface ExternalInputPayload {
    type?: InputType | string;
    source?: {
        type?: SourceType | string;
        name?: string;
    };
    content?: string;
}

export interface ExternalSubjectPayload {
    name: string;
    code?: string;
    description?: string;
}

export interface ExternalTopicPayload {
    name: string;
    subject?: string;
    unit?: string;
    description?: string;
    order?: number;
}

export interface ExternalItemPayload {
    type: ItemType | string;
    title: string;
    description?: string;
    subject?: string;
    topics?: string[];
    startAt?: string;
    endAt?: string;
    dueAt?: string;
    priority?: Priority | string;
    status?: Status | string;
    eventType?: EventType | string;
    actionType?: ActionType | string;
    updateType?: UpdateType | string;
    opportunityType?: OpportunityType | string;
    preparesForTitle?: string;
    supersedesTitle?: string;
    metadata?: Record<string, unknown>;
}

export interface ExternalMaterialPayload {
    type: MaterialType | string;
    title: string;
    description?: string;
    subject?: string;
    topics?: string[];
    origin?: MaterialOrigin | string;
    content?: string;
    url?: string;
    testData?: MockTestData;
    metadata?: Record<string, unknown>;
}

export interface ExternalImportEnvelope {
    version?: number;
    input?: ExternalInputPayload;
    subjects?: (ExternalSubjectPayload | string)[];
    topics?: ExternalTopicPayload[];
    items?: ExternalItemPayload[];
    materials?: ExternalMaterialPayload[];
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    summary?: {
        subjectsCount: number;
        topicsCount: number;
        itemsCount: number;
        materialsCount: number;
        hasInputProvenance: boolean;
    };
    normalizedPayload?: ExternalImportEnvelope;
}