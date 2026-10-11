// lib/core/storage.ts
import { StudidexState } from "./types";
import { INITIAL_STUDIDEX_STATE } from "./sample-data";
import { getDexieState, saveDexieState, clearDexieState } from "../db/dexie";

const STORAGE_KEY = "studidex_academic_state_v1";
const STATE_EVENT = "studidex:state-change";

let cachedState: StudidexState = INITIAL_STUDIDEX_STATE;
let lastRawString: string | null = null;
let isInitialized = false;

// Initialize background load from Dexie IndexedDB
if (typeof window !== "undefined") {
    setTimeout(async () => {
        try {
            const dexieState = await getDexieState();
            if (dexieState && (dexieState.subjects.length > 0 || dexieState.items.length > 0 || dexieState.profile?.name)) {
                cachedState = dexieState;
                lastRawString = JSON.stringify(dexieState);
                isInitialized = true;
                window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: dexieState }));
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

        // Save to IndexedDB via Dexie
        saveDexieState(payload).catch((err) => {
            console.warn("Studidex: Error persisting to Dexie:", err);
        });

        // Fast synchronous cache in localStorage for SSR hydration
        localStorage.setItem(STORAGE_KEY, serialized);

        window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: payload }));
    } catch (e) {
        console.error("Studidex: Error saving state.", e);
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
