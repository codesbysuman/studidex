// lib/core/mutations.ts
import {
    AcademicItem,
    ExternalImportEnvelope,
    Material,
    MockTestAttempt,
    StudidexState,
    Subject,
    Topic,
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
