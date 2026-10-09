// lib/use-studidex.ts
"use client";

import { useSyncExternalStore } from "react";
import {
    INITIAL_STUDIDEX_STATE,
    clearAllState,
    deleteItem,
    deleteMaterial,
    getStoredState,
    mergeImportEnvelope,
    recordTestAttempt,
    resetStateToSample,
    saveStoredState,
    subscribeToState,
    toggleActionStatus,
    updateItem,
    updateTopicProgress,
    updateUserProfile,
    UserProfile,
    AcademicPaper,
    MockTestAttempt,
    ExternalImportEnvelope,
    NormalizedImportResult,
} from "./core";

const emptySubscribe = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;
const getServerSnapshot = () => INITIAL_STUDIDEX_STATE;

/**
 * React hook to synchronize state across client views without hydration mismatch
 */
export function useStudidex() {
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

    const toggleAction = (actionId: string) => {
        const current = getStoredState();
        const next = toggleActionStatus(current, actionId);
        saveStoredState(next);
    };

    const importEnvelope = (envelope: ExternalImportEnvelope): NormalizedImportResult => {
        const current = getStoredState();
        const { result, nextState } = mergeImportEnvelope(current, envelope);
        saveStoredState(nextState);
        return result;
    };

    const modifyItem = (id: string, updates: Parameters<typeof updateItem>[2]) => {
        const current = getStoredState();
        const next = updateItem(current, id, updates);
        saveStoredState(next);
    };

    const removeItem = (id: string) => {
        const current = getStoredState();
        const next = deleteItem(current, id);
        saveStoredState(next);
    };

    const removeMaterial = (id: string) => {
        const current = getStoredState();
        const next = deleteMaterial(current, id);
        saveStoredState(next);
    };

    const saveTestAttempt = (materialId: string, attempt: MockTestAttempt) => {
        const current = getStoredState();
        const next = recordTestAttempt(current, materialId, attempt);
        saveStoredState(next);
    };

    const setTopicProgress = (topicId: string, progress: number) => {
        const current = getStoredState();
        const next = updateTopicProgress(current, topicId, progress);
        saveStoredState(next);
    };

    const updateProfile = (
        profile: Partial<UserProfile>,
        additionalSubjectNames?: string[],
        additionalPapers?: AcademicPaper[]
    ) => {
        const current = getStoredState();
        const next = updateUserProfile(current, profile, additionalSubjectNames, additionalPapers);
        saveStoredState(next);
    };

    const resetSample = () => {
        resetStateToSample();
    };

    const clearAll = () => {
        clearAllState();
    };

    return {
        state,
        isHydrated,
        toggleAction,
        importEnvelope,
        modifyItem,
        removeItem,
        removeMaterial,
        saveTestAttempt,
        setTopicProgress,
        updateProfile,
        resetSample,
        clearAll,
    };
}
