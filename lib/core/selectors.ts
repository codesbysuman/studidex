// lib/core/selectors.ts
import {
    AcademicItem,
    Material,
    MockTestData,
    StudidexState,
    Subject,
    Topic,
} from "./types";

/**
 * Normalizes date to YYYY-MM-DD in local time
 */
export function toDateKey(dateInput?: string | Date): string {
    if (!dateInput) return "";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function formatHumanDate(dateInput?: string | Date): string {
    if (!dateInput) return "";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

export function formatTime(dateInput?: string | Date): string {
    if (!dateInput) return "";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

/**
 * Gets reference date (defaults to current system date or matches item timestamp baseline)
 */
export function getSystemDate(): Date {
    return new Date();
}

// ==========================================
// HOME VIEW SELECTORS (Sections 9, 10, 22)
// ==========================================

export interface SmartHomeData {
    todayLabel: string;
    todayClasses: AcademicItem[];
    todayEvents: AcademicItem[];
    dueTodayActions: AcademicItem[];
    overdueActions: AcademicItem[];
    nextItems: AcademicItem[];
    prepareSection?: {
        event: AcademicItem;
        subject?: Subject;
        topics: Topic[];
        syllabusUnits: string[];
        materials: Material[];
        mockTests: Material[];
        pyqs: Material[];
        prepActions: AcademicItem[];
    };
    recentUpdates: AcademicItem[];
    opportunities: AcademicItem[];
}

export function getSmartHomeData(state: StudidexState, refDate: Date = getSystemDate()): SmartHomeData {
    const todayKey = toDateKey(refDate);
    const todayLabel = refDate.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    const activeItems = state.items.filter((i) => i.status !== "archived" && i.status !== "cancelled");

    // 1. TODAY'S CLASSES & EVENTS
    const todayClasses: AcademicItem[] = [];
    const todayEvents: AcademicItem[] = [];
    const dueTodayActions: AcademicItem[] = [];
    const overdueActions: AcademicItem[] = [];
    const nextItems: AcademicItem[] = [];
    const recentUpdates: AcademicItem[] = [];
    const opportunities: AcademicItem[] = [];

    const nowTime = refDate.getTime();

    for (const item of activeItems) {
        if (item.type === "event") {
            const startKey = toDateKey(item.startAt);
            if (startKey === todayKey) {
                if (item.eventType === "class") {
                    todayClasses.push(item);
                } else {
                    todayEvents.push(item);
                }
            } else if (item.startAt && new Date(item.startAt).getTime() > nowTime) {
                // Upcoming in the future
                nextItems.push(item);
            }
        } else if (item.type === "action") {
            if (item.status === "completed") continue;
            const dueKey = toDateKey(item.dueAt);
            if (dueKey === todayKey) {
                dueTodayActions.push(item);
            } else if (item.dueAt && new Date(item.dueAt).getTime() < nowTime) {
                overdueActions.push(item);
            } else if (item.dueAt && new Date(item.dueAt).getTime() > nowTime) {
                nextItems.push(item);
            }
        } else if (item.type === "update") {
            recentUpdates.push(item);
        } else if (item.type === "opportunity") {
            opportunities.push(item);
        }
    }

    // Sort today's classes by time
    todayClasses.sort((a, b) => (new Date(a.startAt || 0).getTime() - new Date(b.startAt || 0).getTime()));
    todayEvents.sort((a, b) => (new Date(a.startAt || 0).getTime() - new Date(b.startAt || 0).getTime()));

    // Sort NEXT items chronologically
    nextItems.sort((a, b) => {
        const timeA = new Date(a.startAt || a.dueAt || 0).getTime();
        const timeB = new Date(b.startAt || b.dueAt || 0).getTime();
        return timeA - timeB;
    });

    // 2. PREPARE SECTION LOGIC
    // If a test or exam is approaching within next 14 days, build preparation context
    let prepareSection: SmartHomeData["prepareSection"] = undefined;
    const upcomingExam = nextItems.find(
        (i) => i.type === "event" && (i.eventType === "exam" || i.eventType === "test")
    );

    if (upcomingExam) {
        const subject = state.subjects.find((s) => s.id === upcomingExam.subjectId);
        const relatedTopics = state.topics.filter(
            (t) => upcomingExam.topicIds?.includes(t.id) || t.subjectId === upcomingExam.subjectId
        );

        // Extract units
        const syllabusUnits: string[] = [];
        if (upcomingExam.metadata?.units) {
            syllabusUnits.push(String(upcomingExam.metadata.units));
        } else {
            relatedTopics.forEach((t) => {
                if (t.unit && !syllabusUnits.includes(t.unit)) syllabusUnits.push(t.unit);
            });
        }

        // Find materials related to this subject / topics
        const relatedMaterials = state.materials.filter(
            (m) =>
                m.subjectId === upcomingExam.subjectId ||
                m.topicIds?.some((tid) => upcomingExam.topicIds?.includes(tid))
        );

        const mockTests = relatedMaterials.filter((m) => m.type === "mock_test");
        const pyqs = relatedMaterials.filter((m) => m.type === "pyq");
        const prepActions = state.items.filter(
            (i) => i.preparesForItemId === upcomingExam.id || (i.subjectId === upcomingExam.subjectId && i.type === "action")
        );

        prepareSection = {
            event: upcomingExam,
            subject,
            topics: relatedTopics,
            syllabusUnits,
            materials: relatedMaterials.filter((m) => m.type !== "mock_test" && m.type !== "pyq"),
            mockTests,
            pyqs,
            prepActions,
        };
    }

    return {
        todayLabel,
        todayClasses,
        todayEvents,
        dueTodayActions,
        overdueActions,
        nextItems: nextItems.slice(0, 6), // Keep Home concentrated
        prepareSection,
        recentUpdates: recentUpdates.slice(0, 3),
        opportunities: opportunities.slice(0, 2),
    };
}

// ==========================================
// PLAN AGENDA SELECTORS (Section 11)
// ==========================================

export interface PlanDateGroup {
    dateKey: string;
    humanLabel: string;
    isToday: boolean;
    isPast: boolean;
    items: AcademicItem[];
}

export function getPlanAgenda(state: StudidexState, refDate: Date = getSystemDate()): PlanDateGroup[] {
    const todayKey = toDateKey(refDate);

    // Collect all scheduled events + dated actions
    const scheduled = state.items.filter(
        (i) => (i.type === "event" && i.startAt) || (i.type === "action" && i.dueAt)
    );

    // Sort chronologically
    scheduled.sort((a, b) => {
        const timeA = new Date(a.startAt || a.dueAt || 0).getTime();
        const timeB = new Date(b.startAt || b.dueAt || 0).getTime();
        return timeA - timeB;
    });

    const groupsMap = new Map<string, AcademicItem[]>();
    for (const item of scheduled) {
        const key = toDateKey(item.startAt || item.dueAt);
        if (!groupsMap.has(key)) {
            groupsMap.set(key, []);
        }
        groupsMap.get(key)!.push(item);
    }

    const groups: PlanDateGroup[] = [];
    for (const [dateKey, items] of groupsMap.entries()) {
        const itemDate = new Date(`${dateKey}T00:00:00`);
        let humanLabel = formatHumanDate(itemDate);
        const isToday = dateKey === todayKey;
        if (isToday) {
            humanLabel = `Today · ${humanLabel}`;
        }

        const isPast = dateKey < todayKey;

        groups.push({
            dateKey,
            humanLabel,
            isToday,
            isPast,
            items,
        });
    }

    return groups;
}

// ==========================================
// ACTIONS SELECTORS (Section 12)
// ==========================================

export interface ActionsGrouped {
    doToday: AcademicItem[];
    overdue: AcademicItem[];
    upcoming: AcademicItem[];
    completed: AcademicItem[];
    counts: {
        totalPending: number;
        doToday: number;
        overdue: number;
        upcoming: number;
        completed: number;
    };
}

export function getActionsGrouped(state: StudidexState, refDate: Date = getSystemDate()): ActionsGrouped {
    const todayKey = toDateKey(refDate);
    const nowTime = refDate.getTime();

    const doToday: AcademicItem[] = [];
    const overdue: AcademicItem[] = [];
    const upcoming: AcademicItem[] = [];
    const completed: AcademicItem[] = [];

    const actions = state.items.filter((i) => i.type === "action");

    for (const action of actions) {
        if (action.status === "completed") {
            completed.push(action);
            continue;
        }

        const dueKey = toDateKey(action.dueAt);
        if (dueKey === todayKey) {
            doToday.push(action);
        } else if (action.dueAt && new Date(action.dueAt).getTime() < nowTime) {
            overdue.push(action);
        } else {
            upcoming.push(action);
        }
    }

    // Sort upcoming by due date
    upcoming.sort((a, b) => {
        const timeA = new Date(a.dueAt || "9999-12-31").getTime();
        const timeB = new Date(b.dueAt || "9999-12-31").getTime();
        return timeA - timeB;
    });

    completed.sort((a, b) => {
        const timeA = new Date(a.completedAt || 0).getTime();
        const timeB = new Date(b.completedAt || 0).getTime();
        return timeB - timeA;
    });

    return {
        doToday,
        overdue,
        upcoming,
        completed,
        counts: {
            totalPending: doToday.length + overdue.length + upcoming.length,
            doToday: doToday.length,
            overdue: overdue.length,
            upcoming: upcoming.length,
            completed: completed.length,
        },
    };
}

// ==========================================
// MATERIALS SELECTORS (Section 13)
// ==========================================

export interface MaterialCategoryGroup {
    yourNotes: Material[];
    ourNotes: Material[];
    syllabus: Material[];
    pyqs: Material[];
    mockTests: Material[];
    other: Material[];
}

export function categorizeMaterials(materials: Material[]): MaterialCategoryGroup {
    const yourNotes: Material[] = [];
    const ourNotes: Material[] = [];
    const syllabus: Material[] = [];
    const pyqs: Material[] = [];
    const mockTests: Material[] = [];
    const other: Material[] = [];

    for (const mat of materials) {
        if (mat.type === "mock_test") {
            mockTests.push(mat);
        } else if (mat.type === "pyq") {
            pyqs.push(mat);
        } else if (mat.type === "syllabus") {
            syllabus.push(mat);
        } else if (mat.origin === "personal") {
            yourNotes.push(mat);
        } else if (mat.origin === "teacher" || mat.origin === "college" || mat.origin === "library" || mat.origin === "system") {
            ourNotes.push(mat);
        } else {
            other.push(mat);
        }
    }

    return { yourNotes, ourNotes, syllabus, pyqs, mockTests, other };
}

// ==========================================
// PREPARATION CONTEXT SELECTOR (Section 14)
// ==========================================

export interface PreparationDetail {
    event: AcademicItem;
    subject?: Subject;
    topics: Topic[];
    syllabusUnits: string[];
    yourMaterials: Material[];
    ourMaterials: Material[];
    mockTests: Material[];
    pyqs: Material[];
    prepActions: AcademicItem[];
    relatedAssignments: AcademicItem[];
}

export function getPreparationDetail(state: StudidexState, eventId: string): PreparationDetail | null {
    const event = state.items.find((i) => i.id === eventId && i.type === "event");
    if (!event) return null;

    const subject = state.subjects.find((s) => s.id === event.subjectId);
    const topics = state.topics.filter(
        (t) => event.topicIds?.includes(t.id) || t.subjectId === event.subjectId
    );

    const syllabusUnits: string[] = [];
    if (event.metadata?.units) {
        syllabusUnits.push(String(event.metadata.units));
    }
    topics.forEach((t) => {
        if (t.unit && !syllabusUnits.includes(t.unit)) syllabusUnits.push(t.unit);
    });

    const relatedMaterials = state.materials.filter(
        (m) => m.subjectId === event.subjectId || m.topicIds?.some((tid) => event.topicIds?.includes(tid))
    );

    const yourMaterials = relatedMaterials.filter((m) => m.origin === "personal" && m.type !== "mock_test");
    const ourMaterials = relatedMaterials.filter(
        (m) => m.origin !== "personal" && m.type !== "mock_test" && m.type !== "pyq"
    );
    const mockTests = relatedMaterials.filter((m) => m.type === "mock_test");
    const pyqs = relatedMaterials.filter((m) => m.type === "pyq");

    const prepActions = state.items.filter(
        (i) => i.preparesForItemId === event.id || (i.subjectId === event.subjectId && i.actionType === "preparation")
    );

    const relatedAssignments = state.items.filter(
        (i) =>
            i.type === "action" &&
            (i.relatedItemIds?.includes(event.id) || (i.subjectId === event.subjectId && toDateKey(i.dueAt) === toDateKey(event.startAt)))
    );

    return {
        event,
        subject,
        topics,
        syllabusUnits,
        yourMaterials,
        ourMaterials,
        mockTests,
        pyqs,
        prepActions,
        relatedAssignments,
    };
}
