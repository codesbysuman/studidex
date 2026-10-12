// lib/core/storage.ts
import { StudidexState, AcademicItem, Subject, Topic, Material, UserProfile } from "./types";
import { INITIAL_STUDIDEX_STATE } from "./sample-data";
import { getDexieState, saveDexieState, clearDexieState } from "../db/dexie";

const STORAGE_KEY = "studidex_academic_state_v1";
const STATE_EVENT = "studidex:state-change";

let cachedState: StudidexState = INITIAL_STUDIDEX_STATE;
let lastRawString: string | null = null;
let isInitialized = false;

// Initialize background load from Dexie IndexedDB with coherent sync
if (typeof window !== "undefined") {
    setTimeout(async () => {
        try {
            const dexieState = await getDexieState();
            const localState = getStoredState();

            if (dexieState && (dexieState.subjects.length > 0 || dexieState.items.length > 0 || dexieState.profile?.name)) {
                // If local storage is empty or older, prioritize Dexie
                const dexieTime = dexieState.lastUpdated ? new Date(dexieState.lastUpdated).getTime() : 0;
                const localTime = localState.lastUpdated ? new Date(localState.lastUpdated).getTime() : 0;

                if (dexieTime >= localTime || (localState.subjects.length === 0 && localState.items.length === 0)) {
                    cachedState = dexieState;
                    const serialized = JSON.stringify(dexieState);
                    lastRawString = serialized;
                    isInitialized = true;
                    try {
                        localStorage.setItem(STORAGE_KEY, serialized);
                    } catch {
                        // ignore quota limit
                    }
                    window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: dexieState }));
                } else {
                    // LocalStorage has more recent data, persist it back to Dexie
                    saveDexieState(localState).catch(() => {});
                }
            } else if (localState.subjects.length > 0 || localState.items.length > 0) {
                // Seed Dexie from localStorage
                saveDexieState(localState).catch(() => {});
            }
        } catch (e) {
            console.warn("Studidex: Dexie hydration error:", e);
        }
    }, 0);
}

/**
 * Safe local storage reader for SSR & client with referential caching for useSyncExternalStore
 */
export function getStoredState(): StudidexState {
    if (typeof window === "undefined") {
        return INITIAL_STUDIDEX_STATE;
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            cachedState = INITIAL_STUDIDEX_STATE;
            lastRawString = null;
            isInitialized = true;
            return cachedState;
        }
        if (isInitialized && raw === lastRawString) {
            return cachedState;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.subjects || !parsed.items) {
            cachedState = INITIAL_STUDIDEX_STATE;
            isInitialized = true;
            return cachedState;
        }
        lastRawString = raw;
        cachedState = {
            ...parsed,
            profile: {
                ...INITIAL_STUDIDEX_STATE.profile,
                ...(parsed.profile || {}),
                papers: parsed.profile?.papers || [],
            },
        } as StudidexState;
        isInitialized = true;
        return cachedState;
    } catch (e) {
        console.warn("Studidex: Error reading local storage.", e);
        cachedState = INITIAL_STUDIDEX_STATE;
        isInitialized = true;
        return cachedState;
    }
}

/**
 * Save updated state to IndexedDB (Dexie) and fallback storage, broadcasting to listeners
 */
export function saveStoredState(state: StudidexState): void {
    if (typeof window === "undefined") return;

    try {
        const payload: StudidexState = {
            ...state,
            lastUpdated: new Date().toISOString(),
        };
        const serialized = JSON.stringify(payload);
        cachedState = payload;
        lastRawString = serialized;
        isInitialized = true;

        // Save to IndexedDB via Dexie asynchronously
        saveDexieState(payload).catch((err) => {
            console.warn("Studidex: Error persisting to Dexie:", err);
        });

        // Fast synchronous cache in localStorage for SSR hydration (with quota catch)
        try {
            localStorage.setItem(STORAGE_KEY, serialized);
        } catch {
            // LocalStorage quota may be exceeded by large content, Dexie remains primary
        }

        window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: payload }));
    } catch (e) {
        console.error("Studidex: Error saving state.", e);
    }
}

/**
 * Reconcile two Studidex states (e.g. Local client workspace + Remote cloud database)
 * Preserves additions on both sides and prevents accidental data loss during offline/online shifts.
 */
export function reconcileStudidexStates(local: StudidexState, remote: StudidexState): StudidexState {
    if (!remote || (!remote.subjects?.length && !remote.items?.length && !remote.profile?.name)) {
        return local;
    }
    if (!local || (!local.subjects?.length && !local.items?.length && !local.profile?.name)) {
        return remote;
    }

    // 1. Profile reconciliation
    const mergedProfile: UserProfile = {
        name: remote.profile.name || local.profile.name || "Student",
        stage: remote.profile.stage || local.profile.stage || "ug",
        className: remote.profile.className || local.profile.className,
        degree: remote.profile.degree || local.profile.degree,
        examiningBody: remote.profile.examiningBody || local.profile.examiningBody || remote.profile.board || local.profile.board,
        board: remote.profile.board || local.profile.board || remote.profile.examiningBody || local.profile.examiningBody,
        medium: remote.profile.medium || local.profile.medium || "English",
        institutionName: remote.profile.institutionName || local.profile.institutionName,
        center: remote.profile.center || local.profile.center,
        stream: remote.profile.stream || local.profile.stream,
        specialization: remote.profile.specialization || local.profile.specialization,
        minorSpecialization: remote.profile.minorSpecialization || local.profile.minorSpecialization,
        hasCompletedOnboarding: remote.profile.hasCompletedOnboarding ?? local.profile.hasCompletedOnboarding ?? true,
        papers: [...(local.profile.papers || [])],
        enrolledSubjectIds: Array.from(new Set([...(local.profile.enrolledSubjectIds || []), ...(remote.profile.enrolledSubjectIds || [])])),
    };

    // Merge papers
    (remote.profile.papers || []).forEach((rp) => {
        if (!mergedProfile.papers?.some((lp) => lp.id === rp.id || lp.name.toLowerCase() === rp.name.toLowerCase())) {
            mergedProfile.papers?.push(rp);
        }
    });

    // 2. Subjects reconciliation
    const subjectMap = new Map<string, Subject>();
    local.subjects.forEach((s) => subjectMap.set(s.id, s));
    remote.subjects.forEach((s) => {
        if (!subjectMap.has(s.id)) {
            subjectMap.set(s.id, s);
        }
    });

    // 3. Topics reconciliation
    const topicMap = new Map<string, Topic>();
    local.topics.forEach((t) => topicMap.set(t.id, t));
    remote.topics.forEach((t) => {
        if (!topicMap.has(t.id)) {
            topicMap.set(t.id, t);
        } else {
            // Keep highest topic progress
            const existing = topicMap.get(t.id)!;
            topicMap.set(t.id, {
                ...existing,
                progressPercent: Math.max(existing.progressPercent || 0, t.progressPercent || 0),
            });
        }
    });

    // 4. Academic Items reconciliation
    const itemMap = new Map<string, AcademicItem>();
    local.items.forEach((i) => itemMap.set(i.id, i));
    remote.items.forEach((i) => {
        if (!itemMap.has(i.id)) {
            itemMap.set(i.id, i);
        } else {
            // If one is completed, keep the completed status
            const existing = itemMap.get(i.id)!;
            if (i.status === "completed" || i.completedAt) {
                itemMap.set(i.id, i);
            } else if (existing.status !== "completed") {
                itemMap.set(i.id, { ...existing, ...i });
            }
        }
    });

    // 5. Materials reconciliation
    const matMap = new Map<string, Material>();
    local.materials.forEach((m) => matMap.set(m.id, m));
    remote.materials.forEach((m) => {
        if (!matMap.has(m.id)) {
            matMap.set(m.id, m);
        } else {
            const existing = matMap.get(m.id)!;
            // Merge test attempts if mock test
            const existingAttempts = existing.userProgress?.attempts || [];
            const remoteAttempts = m.userProgress?.attempts || [];
            const attemptIds = new Set(existingAttempts.map((a) => a.id));
            const mergedAttempts = [...existingAttempts];
            remoteAttempts.forEach((ra) => {
                if (!attemptIds.has(ra.id)) mergedAttempts.push(ra);
            });

            matMap.set(m.id, {
                ...existing,
                ...m,
                userProgress: {
                    ...existing.userProgress,
                    ...m.userProgress,
                    attempts: mergedAttempts,
                },
            });
        }
    });

    // 6. Inputs reconciliation
    const inputMap = new Map<string, (typeof local.inputs)[0]>();
    (local.inputs || []).forEach((inp) => inputMap.set(inp.id, inp));
    (remote.inputs || []).forEach((inp) => {
        if (!inputMap.has(inp.id)) inputMap.set(inp.id, inp);
    });

    return {
        version: 1,
        lastUpdated: new Date().toISOString(),
        profile: mergedProfile,
        subjects: Array.from(subjectMap.values()),
        topics: Array.from(topicMap.values()),
        items: Array.from(itemMap.values()),
        materials: Array.from(matMap.values()),
        inputs: Array.from(inputMap.values()),
    };
}

/**
 * Subscribe to state updates across components
 */
export function subscribeToState(callback: () => void): () => void {
    if (typeof window === "undefined") {
        return () => {};
    }

    const handler = () => {
        getStoredState();
        callback();
    };

    window.addEventListener(STATE_EVENT, handler);
    window.addEventListener("storage", handler);

    return () => {
        window.removeEventListener(STATE_EVENT, handler);
        window.removeEventListener("storage", handler);
    };
}

/**
 * Clear all data (fresh clean production state)
 */
export function clearAllState(): StudidexState {
    saveStoredState(INITIAL_STUDIDEX_STATE);
    clearDexieState().catch(() => {});
    return INITIAL_STUDIDEX_STATE;
}

/**
 * Reset data to clean initial state
 */
export function resetStateToSample(): StudidexState {
    return clearAllState();
}
