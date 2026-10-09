// lib/core/mutations.ts
import {
    AcademicItem,
    ExternalImportEnvelope,
    Material,
    MockTestAttempt,
    StudidexState,
    Subject,
    Topic,
    UserProfile,
    AcademicPaper,
} from "./types";
import { normalizeAndMerge, NormalizedImportResult } from "./normalize";
import { generateId } from "./ids";

/**
 * Toggle an action item between active and completed
 */
export function toggleActionStatus(state: StudidexState, actionId: string): StudidexState {
    const updatedItems = state.items.map((item) => {
        if (item.id !== actionId) return item;
        const isNowCompleted = item.status !== "completed";
        return {
            ...item,
            status: (isNowCompleted ? "completed" : "active") as AcademicItem["status"],
            completedAt: isNowCompleted ? new Date().toISOString() : undefined,
        };
    });

    return {
        ...state,
        items: updatedItems,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Update an existing academic item
 */
export function updateItem(
    state: StudidexState,
    itemId: string,
    updates: Partial<AcademicItem>
): StudidexState {
    const updatedItems = state.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
            ...item,
            ...updates,
        };
    });

    return {
        ...state,
        items: updatedItems,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Delete an academic item
 */
export function deleteItem(state: StudidexState, itemId: string): StudidexState {
    return {
        ...state,
        items: state.items.filter((item) => item.id !== itemId),
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Delete a material
 */
export function deleteMaterial(state: StudidexState, materialId: string): StudidexState {
    return {
        ...state,
        materials: state.materials.filter((m) => m.id !== materialId),
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Record a mock test attempt and update user progress
 */
export function recordTestAttempt(
    state: StudidexState,
    materialId: string,
    attempt: MockTestAttempt
): StudidexState {
    const updatedMaterials = state.materials.map((mat) => {
        if (mat.id !== materialId) return mat;
        const prevProgress = mat.userProgress || { attempts: [] };
        const existingAttempts = prevProgress.attempts || [];

        return {
            ...mat,
            userProgress: {
                ...prevProgress,
                completed: true,
                lastAttemptScore: attempt.score,
                totalMarks: attempt.totalMarks,
                attempts: [attempt, ...existingAttempts],
            },
        };
    });

    return {
        ...state,
        materials: updatedMaterials,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Add or update subject
 */
export function saveSubject(state: StudidexState, subject: Partial<Subject> & { name: string }): StudidexState {
    const existingIdx = state.subjects.findIndex((s) => s.id === subject.id);
    let updatedSubjects = [...state.subjects];

    if (existingIdx >= 0) {
        updatedSubjects[existingIdx] = {
            ...updatedSubjects[existingIdx],
            ...subject,
        };
    } else {
        const newSubject: Subject = {
            id: subject.id || generateId("subj"),
            name: subject.name,
            code: subject.code,
            description: subject.description,
            createdAt: new Date().toISOString(),
        };
        updatedSubjects.push(newSubject);
    }

    return {
        ...state,
        subjects: updatedSubjects,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Update progress on a syllabus topic
 */
export function updateTopicProgress(
    state: StudidexState,
    topicId: string,
    progressPercent: number
): StudidexState {
    const updatedTopics = state.topics.map((t) => {
        if (t.id !== topicId) return t;
        return {
            ...t,
            progressPercent: Math.max(0, Math.min(100, progressPercent)),
        };
    });

    return {
        ...state,
        topics: updatedTopics,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Merge an external AI envelope into the state
 */
export function mergeImportEnvelope(
    state: StudidexState,
    envelope: ExternalImportEnvelope
): { result: NormalizedImportResult; nextState: StudidexState } {
    const result = normalizeAndMerge(state, envelope);
    return {
        result,
        nextState: result.mergedState,
    };
}

/**
 * Update user profile details and synchronize enrolled subjects & papers
 */
export function updateUserProfile(
    state: StudidexState,
    profileUpdates: Partial<UserProfile>,
    additionalSubjectNames?: string[],
    additionalPapers?: AcademicPaper[]
): StudidexState {
    let updatedSubjects = [...state.subjects];
    const enrolledIds = new Set<string>(profileUpdates.enrolledSubjectIds ?? state.profile?.enrolledSubjectIds ?? []);

    // 1. Sync additional subject names
    if (additionalSubjectNames && additionalSubjectNames.length > 0) {
        additionalSubjectNames.forEach((name) => {
            const cleanName = name.trim();
            if (!cleanName) return;
            const existing = updatedSubjects.find(
                (s) => s.name.toLowerCase() === cleanName.toLowerCase()
            );
            if (existing) {
                enrolledIds.add(existing.id);
            } else {
                const newId = generateId("subj");
                updatedSubjects.push({
                    id: newId,
                    name: cleanName,
                    createdAt: new Date().toISOString(),
                });
                enrolledIds.add(newId);
            }
        });
    }

    // 2. Sync academic papers (especially for UG & PG systems, e.g. SEC-Panchayati Raj in Practice)
    const papersList = [
        ...(profileUpdates.papers || state.profile?.papers || []),
        ...(additionalPapers || []),
    ];

    const deduplicatedPapers: AcademicPaper[] = [];
    papersList.forEach((paper) => {
        if (!paper.name?.trim()) return;
        const cleanName = paper.name.trim();
        
        // Find or create matching subject entry so it shows in materials & plan
        let matchingSubject = updatedSubjects.find(
            (s) =>
                s.name.toLowerCase() === cleanName.toLowerCase() ||
                (paper.code && s.code && s.code.toLowerCase() === paper.code.toLowerCase())
        );

        if (!matchingSubject) {
            const newSubjId = generateId("subj");
            matchingSubject = {
                id: newSubjId,
                name: cleanName,
                code: paper.code,
                paperCategory: paper.category,
                semester: paper.semester,
                credits: paper.credits,
                createdAt: new Date().toISOString(),
            };
            updatedSubjects.push(matchingSubject);
        } else {
            // Update paper metadata if missing
            if (paper.category && !matchingSubject.paperCategory) {
                matchingSubject.paperCategory = paper.category;
            }
            if (paper.code && !matchingSubject.code) {
                matchingSubject.code = paper.code;
            }
        }

        enrolledIds.add(matchingSubject.id);

        if (!deduplicatedPapers.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
            deduplicatedPapers.push({
                ...paper,
                id: paper.id || generateId("paper"),
                subjectId: matchingSubject.id,
            });
        }
    });

    const currentProfile: UserProfile = state.profile || { name: "Student", stage: "ug" };
    const mergedProfile: UserProfile = {
        ...currentProfile,
        ...profileUpdates,
        enrolledSubjectIds: Array.from(enrolledIds),
        papers: deduplicatedPapers,
    };

    return {
        ...state,
        profile: mergedProfile,
        subjects: updatedSubjects,
        lastUpdated: new Date().toISOString(),
    };
}

