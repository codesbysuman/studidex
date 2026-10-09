// lib/core/storage.ts
import { StudidexState } from "./types";
import { INITIAL_STUDIDEX_STATE } from "./sample-data";

const STORAGE_KEY = "studidex_academic_state_v1";
const STATE_EVENT = "studidex:state-change";

let cachedState: StudidexState = INITIAL_STUDIDEX_STATE;
let lastRawString: string | null = null;
let isInitialized = false;

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
            // First time visitor: seed initial sample state
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDIDEX_STATE));
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
                papers: (parsed.profile?.papers && parsed.profile.papers.length > 0)
                    ? parsed.profile.papers
                    : (INITIAL_STUDIDEX_STATE.profile?.papers || []),
            },
        } as StudidexState;
        isInitialized = true;
        return cachedState;
    } catch (e) {
        console.warn("Studidex: Error reading local storage, falling back to backup snapshot or sample data.", e);
        try {
            const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
            if (backup) {
                cachedState = JSON.parse(backup) as StudidexState;
                isInitialized = true;
                return cachedState;
            }
        } catch {
            // ignore
        }
        cachedState = INITIAL_STUDIDEX_STATE;
        isInitialized = true;
        return cachedState;
    }
}

/**
 * Save updated state to local storage and broadcast to listeners with automatic backup
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
        localStorage.setItem(STORAGE_KEY, serialized);
        // Automatic secondary backup snapshot for data resilience
        localStorage.setItem(`${STORAGE_KEY}_backup`, serialized);
        window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: payload }));
    } catch (e) {
        console.error("Studidex: Error saving state to storage.", e);
    }
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
 * Reset application state back to the default sample dataset
 */
export function resetStateToSample(): StudidexState {
    saveStoredState(INITIAL_STUDIDEX_STATE);
    return INITIAL_STUDIDEX_STATE;
}

/**
 * Clear all data (empty state)
 */
export function clearAllState(): StudidexState {
    const emptyState: StudidexState = {
        version: 1,
        profile: {
            name: "Student",
        },
        lastUpdated: new Date().toISOString(),
        subjects: [],
        topics: [],
        inputs: [],
        items: [],
        materials: [],
    };
    saveStoredState(emptyState);
    return emptyState;
}
