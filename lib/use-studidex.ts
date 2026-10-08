// lib/use-studidex.ts
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
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
    StudidexState,
    MockTestAttempt,
    ExternalImportEnvelope,
    NormalizedImportResult,
} from "./core";

/**
 * React hook to synchronize state across client views
 */
export function useStudidex() {
    const [state, setState] = useState<StudidexState>(getStoredState);

    useEffect(() => {
        // Hydrate from storage on mount
        setState(getStoredState());
        const unsubscribe = subscribeToState((newState) => {
            setState(newState);
        });
        return unsubscribe;
    }, []);

    const toggleAction = (actionId: string) => {
        const next = toggleActionStatus(state, actionId);
        saveStoredState(next);
        setState(next);
    };

    const importEnvelope = (envelope: ExternalImportEnvelope): NormalizedImportResult => {
        const { result, nextState } = mergeImportEnvelope(state, envelope);
        saveStoredState(nextState);
        setState(nextState);
        return result;
    };

    const modifyItem = (id: string, updates: Parameters<typeof updateItem>[2]) => {
        const next = updateItem(state, id, updates);
        saveStoredState(next);
        setState(next);
    };

    const removeItem = (id: string) => {
        const next = deleteItem(state, id);
        saveStoredState(next);
        setState(next);
    };

    const removeMaterial = (id: string) => {
        const next = deleteMaterial(state, id);
        saveStoredState(next);
        setState(next);
    };

    const saveTestAttempt = (materialId: string, attempt: MockTestAttempt) => {
        const next = recordTestAttempt(state, materialId, attempt);
        saveStoredState(next);
        setState(next);
    };

    const setTopicProgress = (topicId: string, progress: number) => {
        const next = updateTopicProgress(state, topicId, progress);
        saveStoredState(next);
        setState(next);
    };

    const resetSample = () => {
        const next = resetStateToSample();
        setState(next);
    };

    const clearAll = () => {
        const next = clearAllState();
        setState(next);
    };

    return {
        state,
        toggleAction,
        importEnvelope,
        modifyItem,
        removeItem,
        removeMaterial,
        saveTestAttempt,
        setTopicProgress,
        resetSample,
        clearAll,
    };
}
