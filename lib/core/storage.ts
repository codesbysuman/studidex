// lib/core/storage.ts
import { StudidexState } from "./types";
import { INITIAL_STUDIDEX_STATE } from "./sample-data";

const STORAGE_KEY = "studidex_academic_state_v1";
const STATE_EVENT = "studidex:state-change";

/**
 * Safe local storage reader for SSR & client
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
            return INITIAL_STUDIDEX_STATE;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.subjects || !parsed.items) {
            return INITIAL_STUDIDEX_STATE;
        }
        return parsed as StudidexState;
    } catch (e) {
        console.warn("Studidex: Error reading local storage, falling back to sample data.", e);
        return INITIAL_STUDIDEX_STATE;
    }
}

/**
 * Save updated state to local storage and broadcast to listeners
 */
export function saveStoredState(state: StudidexState): void {
    if (typeof window === "undefined") return;

    try {
        const payload: StudidexState = {
            ...state,
            lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: payload }));
    } catch (e) {
        console.error("Studidex: Error saving state to storage.", e);
    }
}

/**
 * Subscribe to state updates across components
 */
export function subscribeToState(callback: (state: StudidexState) => void): () => void {
    if (typeof window === "undefined") {
        return () => {};
    }

    const handler = (e: Event) => {
        const customEvent = e as CustomEvent<StudidexState>;
        if (customEvent.detail) {
            callback(customEvent.detail);
        } else {
            callback(getStoredState());
        }
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
