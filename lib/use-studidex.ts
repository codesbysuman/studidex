// lib/use-studidex.ts
"use client";

import { useSyncExternalStore, useEffect, useCallback } from "react";
import {
    INITIAL_STUDIDEX_STATE,
    clearAllState,
    deleteItem,
    deleteMaterial,
    getStoredState,
    mergeImportEnvelope,
    recordTestAttempt,
    saveStoredState,
    subscribeToState,
    toggleActionStatus,
    updateItem,
    updateTopicProgress,
    updateUserProfile,
    createItem,
    createMaterial,
    updateMaterial,
    saveSubject,
    deleteSubject,
    saveTopic,
    deleteTopic,
    reconcileStudidexStates,
    UserProfile,
    AcademicPaper,
    MockTestAttempt,
    ExternalImportEnvelope,
    NormalizedImportResult,
    AcademicItem,
    Material,
    Subject,
    Topic,
    StudidexState,
} from "./core";

const emptySubscribe = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;
let currentServerSnapshot: StudidexState = INITIAL_STUDIDEX_STATE;
const getServerSnapshot = () => currentServerSnapshot;

export interface AuthUser {
    id: string;
    email: string;
    name?: string | null;
    stage?: string | null;
    className?: string | null;
    examiningBody?: string | null;
    board?: string | null;
    institutionName?: string | null;
    specialization?: string | null;
}

// ==========================================
// Shared Singleton Auth Store
// Deduplicates in-flight calls and synchronizes all components
// ==========================================

interface AuthStoreState {
    user: AuthUser | null;
    isCheckingAuth: boolean;
    isDbConnected: boolean;
    isSyncing: boolean;
}

let authStoreState: AuthStoreState = {
    user: null,
    isCheckingAuth: true,
    isDbConnected: false,
    isSyncing: false,
};

const serverAuthStoreState: AuthStoreState = {
    user: null,
    isCheckingAuth: false,
    isDbConnected: false,
    isSyncing: false,
};

const authListeners = new Set<() => void>();

function setAuthStore(patch: Partial<AuthStoreState>) {
    authStoreState = { ...authStoreState, ...patch };
    authListeners.forEach((listener) => listener());
}

function subscribeToAuth(callback: () => void) {
    authListeners.add(callback);
    return () => {
        authListeners.delete(callback);
    };
}

const getAuthSnapshot = () => authStoreState;
const getServerAuthSnapshot = () => serverAuthStoreState;

let inFlightAuthCheck: Promise<void> | null = null;
let hasTriggeredInitialAuth = false;

/**
 * Initializes server-provided user and state into client store
 */
export function initStudidexServerState(
    initialUser: AuthUser | null,
    initialState?: StudidexState | null,
    isDbConnected: boolean = false
) {
    if (initialUser !== undefined) {
        hasTriggeredInitialAuth = true;
        authStoreState = {
            user: initialUser,
            isCheckingAuth: false,
            isDbConnected,
            isSyncing: false,
        };
        serverAuthStoreState.user = initialUser;
        serverAuthStoreState.isDbConnected = isDbConnected;
        authListeners.forEach((listener) => listener());
    }
    if (initialState) {
        currentServerSnapshot = initialState;
        if (typeof window !== "undefined") {
            const local = getStoredState();
            if (local.items.length === 0 && local.subjects.length === 0 && initialState.items.length > 0) {
                saveStoredState(initialState);
            }
        }
    }
}

/**
 * Client component to hydrate server-fetched Studidex data into client singleton store
 */
export function StudidexHydrator({
    user,
    state,
    isDbConnected = false,
}: {
    user: AuthUser | null;
    state?: StudidexState | null;
    isDbConnected?: boolean;
}) {
    initStudidexServerState(user, state, isDbConnected);
    return null;
}

/**
 * Single deduplicated fetch for /api/auth/me
 */
async function performAuthCheck(): Promise<void> {
    if (inFlightAuthCheck) {
        return inFlightAuthCheck;
    }

    inFlightAuthCheck = (async () => {
        try {
            setAuthStore({ isCheckingAuth: true });
            const res = await fetch("/api/auth/me");
            if (!res.ok) {
                setAuthStore({ user: null, isCheckingAuth: false, isDbConnected: false });
                return;
            }

            const data = await res.json();
            if (data.authenticated && data.user) {
                setAuthStore({
                    user: data.user,
                    isDbConnected: !data.databaseOffline,
                    isCheckingAuth: false,
                });

                // Reconcile cloud state and local state smoothly without clobbering
                try {
                    const syncRes = await fetch("/api/sync");
                    if (syncRes.ok) {
                        const syncData = await syncRes.json();
                        if (syncData.success && syncData.state) {
                            const local = getStoredState();
                            const reconciled = reconcileStudidexStates(local, syncData.state);
                            saveStoredState(reconciled);

                            // If local had additions or offline items that cloud lacks, sync back
                            if (
                                (local.items.length > 0 && syncData.state.items.length === 0) ||
                                (local.subjects.length > 0 && syncData.state.subjects.length === 0) ||
                                local.items.length > syncData.state.items.length
                            ) {
                                scheduleCloudSync(reconciled);
                            }
                        }
                    }
                } catch {
                    // Sync fail handled silently, local storage primary
                }
            } else {
                setAuthStore({
                    user: null,
                    isDbConnected: !data.databaseOffline,
                    isCheckingAuth: false,
                });
            }
        } catch {
            setAuthStore({ user: null, isCheckingAuth: false, isDbConnected: false });
        } finally {
            inFlightAuthCheck = null;
        }
    })();

    return inFlightAuthCheck;
}

/**
 * Debounced background cloud sync helper
 */
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleCloudSync(nextState: StudidexState) {
    if (typeof window === "undefined" || !authStoreState.user) return;
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

    setAuthStore({ isSyncing: true });

    syncDebounceTimer = setTimeout(async () => {
        try {
            const res = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nextState),
            });
            if (res.ok) {
                setAuthStore({ isDbConnected: true });
            }
        } catch {
            // Offline retry handled gracefully
        } finally {
            setAuthStore({ isSyncing: false });
        }
    }, 1500);
}

/**
 * React hook to synchronize state across client views, with PostgreSQL cloud sync
 */
export function useStudidex(initialData?: {
    user?: AuthUser | null;
    state?: StudidexState | null;
    isDbConnected?: boolean;
}) {
    if (initialData?.user !== undefined && !hasTriggeredInitialAuth) {
        initStudidexServerState(initialData.user, initialData.state, initialData.isDbConnected);
    }
    const isHydrated = useSyncExternalStore(
        emptySubscribe,
        getClientHydrated,
        getServerHydrated
    );

    const state = useSyncExternalStore(
        subscribeToState,
        getStoredState,
        getServerSnapshot
    );

    const auth = useSyncExternalStore(
        subscribeToAuth,
        getAuthSnapshot,
        getServerAuthSnapshot
    );

    // Initial auth check runs exactly once per app session across all components
    useEffect(() => {
        if (!hasTriggeredInitialAuth && typeof window !== "undefined") {
            hasTriggeredInitialAuth = true;
            performAuthCheck();
        }
    }, []);

    const checkAuth = useCallback(() => {
        return performAuthCheck();
    }, []);

    const toggleAction = (actionId: string) => {
        const current = getStoredState();
        const next = toggleActionStatus(current, actionId);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const importEnvelope = (envelope: ExternalImportEnvelope): NormalizedImportResult => {
        const current = getStoredState();
        const { result, nextState } = mergeImportEnvelope(current, envelope);
        saveStoredState(nextState);
        scheduleCloudSync(nextState);
        return result;
    };

    const modifyItem = (id: string, updates: Parameters<typeof updateItem>[2]) => {
        const current = getStoredState();
        const next = updateItem(current, id, updates);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const addItem = (item: Omit<AcademicItem, "id" | "createdAt"> & { id?: string }) => {
        const current = getStoredState();
        const next = createItem(current, item);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const addMaterial = (material: Omit<Material, "id" | "createdAt"> & { id?: string }) => {
        const current = getStoredState();
        const next = createMaterial(current, material);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const modifyMaterial = (id: string, updates: Partial<Material>) => {
        const current = getStoredState();
        const next = updateMaterial(current, id, updates);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const addSubject = (subject: Partial<Subject> & { name: string }) => {
        const current = getStoredState();
        const next = saveSubject(current, subject);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const removeSubject = (id: string) => {
        const current = getStoredState();
        const next = deleteSubject(current, id);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const addTopic = (topic: Partial<Topic> & { subjectId: string; name: string }) => {
        const current = getStoredState();
        const next = saveTopic(current, topic);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const removeTopic = (id: string) => {
        const current = getStoredState();
        const next = deleteTopic(current, id);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const removeItem = (id: string) => {
        const current = getStoredState();
        const next = deleteItem(current, id);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const removeMaterial = (id: string) => {
        const current = getStoredState();
        const next = deleteMaterial(current, id);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const saveTestAttempt = (materialId: string, attempt: MockTestAttempt) => {
        const current = getStoredState();
        const next = recordTestAttempt(current, materialId, attempt);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const setTopicProgress = (topicId: string, progress: number) => {
        const current = getStoredState();
        const next = updateTopicProgress(current, topicId, progress);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const updateProfile = (
        profile: Partial<UserProfile>,
        additionalSubjectNames?: string[],
        additionalPapers?: AcademicPaper[]
    ) => {
        const current = getStoredState();
        const next = updateUserProfile(current, profile, additionalSubjectNames, additionalPapers);
        saveStoredState(next);
        scheduleCloudSync(next);
    };

    const syncWithCloud = async () => {
        if (!auth.user) return;
        setAuthStore({ isSyncing: true });
        try {
            const current = getStoredState();
            await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(current),
            });
            const res = await fetch("/api/sync");
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.state) {
                    saveStoredState(data.state);
                }
                setAuthStore({ isDbConnected: true });
            }
        } finally {
            setAuthStore({ isSyncing: false });
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setAuthStore({ user: null });
        } catch (e) {
            console.error("Logout error:", e);
        }
    };

    const clearAll = () => {
        clearAllState();
        if (auth.user) {
            scheduleCloudSync(INITIAL_STUDIDEX_STATE);
        }
    };

    return {
        state,
        isHydrated,
        user: auth.user,
        isAuthenticated: Boolean(auth.user),
        isCheckingAuth: auth.isCheckingAuth,
        isDbConnected: auth.isDbConnected,
        isSyncing: auth.isSyncing,
        checkAuth,
        syncWithCloud,
        logout,
        toggleAction,
        importEnvelope,
        modifyItem,
        addItem,
        addMaterial,
        modifyMaterial,
        addSubject,
        removeSubject,
        addTopic,
        removeTopic,
        removeItem,
        removeMaterial,
        saveTestAttempt,
        setTopicProgress,
        updateProfile,
        clearAll,
    };
}
