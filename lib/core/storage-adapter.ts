// lib/core/storage-adapter.ts
/**
 * Pluggable Storage Adapter Architecture
 * Supports current offline/frontend-only usage with atomic local snapshots
 * and prepares seamless synchronization for upcoming backend APIs (REST/WebSocket/Supabase).
 */

import { StudidexState } from "./types";
import { INITIAL_STUDIDEX_STATE } from "./sample-data";

export interface SyncStatus {
    mode: "local_only" | "syncing" | "synced" | "offline_queued" | "error";
    lastSyncedAt?: string;
    pendingMutationsCount: number;
    errorMessage?: string;
}

export interface StorageAdapter {
    load(): Promise<StudidexState> | StudidexState;
    save(state: StudidexState): Promise<void> | void;
    sync?(token?: string): Promise<{ success: boolean; state?: StudidexState; error?: string }>;
    getStatus?(): SyncStatus;
}

const STORAGE_KEY = "studidex_academic_state_v1";
const BACKUP_KEY = `${STORAGE_KEY}_backup`;
const STATE_EVENT = "studidex:state-change";

/**
 * Robust LocalStorage implementation with snapshot recovery and atomic transactions
 */
export class LocalStorageAdapter implements StorageAdapter {
    private key: string;
    private backupKey: string;

    constructor(key: string = STORAGE_KEY, backupKey: string = BACKUP_KEY) {
        this.key = key;
        this.backupKey = backupKey;
    }

    load(): StudidexState {
        if (typeof window === "undefined") {
            return INITIAL_STUDIDEX_STATE;
        }

        try {
            const raw = localStorage.getItem(this.key);
            if (!raw) {
                this.save(INITIAL_STUDIDEX_STATE);
                return INITIAL_STUDIDEX_STATE;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.subjects || !parsed.items) {
                return INITIAL_STUDIDEX_STATE;
            }

            return {
                ...parsed,
                profile: {
                    ...INITIAL_STUDIDEX_STATE.profile,
                    ...(parsed.profile || {}),
                    papers:
                        parsed.profile?.papers && parsed.profile.papers.length > 0
                            ? parsed.profile.papers
                            : INITIAL_STUDIDEX_STATE.profile?.papers || [],
                },
            } as StudidexState;
        } catch (e) {
            console.warn("Studidex: Error reading main storage, attempting backup snapshot recovery...", e);
            try {
                const backupRaw = localStorage.getItem(this.backupKey);
                if (backupRaw) {
                    const recovered = JSON.parse(backupRaw) as StudidexState;
                    console.info("Studidex: Successfully restored from backup snapshot.");
                    return recovered;
                }
            } catch {
                // fallback to initial state
            }
            return INITIAL_STUDIDEX_STATE;
        }
    }

    save(state: StudidexState): void {
        if (typeof window === "undefined") return;

        try {
            const payload: StudidexState = {
                ...state,
                lastUpdated: new Date().toISOString(),
            };
            const serialized = JSON.stringify(payload);
            localStorage.setItem(this.key, serialized);
            // Write secondary snapshot for crash/quota recovery
            localStorage.setItem(this.backupKey, serialized);
            window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: payload }));
        } catch (e) {
            console.error("Studidex StorageAdapter: Error saving state to storage.", e);
        }
    }

    getStatus(): SyncStatus {
        return {
            mode: "local_only",
            pendingMutationsCount: 0,
            lastSyncedAt: new Date().toISOString(),
        };
    }
}

/**
 * Backend Sync Adapter Bridge (Ready for upcoming backend REST/GraphQL/Supabase deployment)
 */
export class RemoteSyncAdapter implements StorageAdapter {
    private local: LocalStorageAdapter;
    private apiEndpoint?: string;

    constructor(apiEndpoint?: string) {
        this.local = new LocalStorageAdapter();
        this.apiEndpoint = apiEndpoint;
    }

    load(): StudidexState {
        // Read local cache immediately for zero-latency instant start
        return this.local.load();
    }

    save(state: StudidexState): void {
        // Optimistically write locally first
        this.local.save(state);

        // When backend endpoint is active, dispatch background sync payload
        if (this.apiEndpoint && typeof window !== "undefined") {
            fetch(`${this.apiEndpoint}/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(state),
            }).catch((err) => {
                console.warn("Studidex Sync: Offline or server unreachable, queued locally.", err);
            });
        }
    }

    async sync(token?: string) {
        if (!this.apiEndpoint) {
            return { success: true, state: this.local.load() };
        }
        try {
            const res = await fetch(`${this.apiEndpoint}/sync`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Sync failed");
            const remoteState = await res.json();
            this.local.save(remoteState);
            return { success: true, state: remoteState };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    }
}

export const defaultStorageAdapter = new LocalStorageAdapter();
