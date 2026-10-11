// lib/db/dexie.ts
import Dexie, { type Table } from "dexie";
import {
  AcademicItem,
  Subject,
  Topic,
  Material,
  UserProfile,
  StudidexState,
  InputProvenance,
} from "../core/types";

export interface DexieMetaRecord {
  key: string;
  data: any;
}

export class StudidexDexieDatabase extends Dexie {
  items!: Table<AcademicItem, string>;
  subjects!: Table<Subject, string>;
  topics!: Table<Topic, string>;
  materials!: Table<Material, string>;
  meta!: Table<DexieMetaRecord, string>;

  constructor() {
    super("studidex_indexed_db");
    this.version(1).stores({
      items: "id, type, subjectId, eventType, actionType, status, dueAt, startAt",
      subjects: "id, name, code",
      topics: "id, subjectId, name",
      materials: "id, type, subjectId, origin",
      meta: "key",
    });
  }
}

export const db =
  typeof window !== "undefined" ? new StudidexDexieDatabase() : null;

/**
 * Loads entire StudidexState from IndexedDB via Dexie
 */
export async function getDexieState(): Promise<StudidexState | null> {
  if (!db || typeof window === "undefined") return null;

  try {
    const [items, subjects, topics, materials, profileRecord, lastUpdatedRecord, inputsRecord] =
      await Promise.all([
        db.items.toArray(),
        db.subjects.toArray(),
        db.topics.toArray(),
        db.materials.toArray(),
        db.meta.get("profile"),
        db.meta.get("lastUpdated"),
        db.meta.get("inputs"),
      ]);

    // If there is no profile record and no items/subjects, IndexedDB is uninitialized
    if (!profileRecord && subjects.length === 0 && items.length === 0) {
      return null;
    }

    const profile: UserProfile = profileRecord?.data || {
      name: "",
      stage: "ug",
      hasCompletedOnboarding: true,
    };

    return {
      version: 1,
      lastUpdated: lastUpdatedRecord?.data || new Date().toISOString(),
      profile,
      subjects: subjects || [],
      topics: topics || [],
      inputs: (inputsRecord?.data as InputProvenance[]) || [],
      items: items || [],
      materials: materials || [],
    };
  } catch (error) {
    console.warn("Studidex: Error reading from IndexedDB (Dexie):", error);
    return null;
  }
}

/**
 * Persists entire StudidexState into IndexedDB via Dexie
 */
export async function saveDexieState(state: StudidexState): Promise<void> {
  if (!db || typeof window === "undefined") return;

  try {
    await db.transaction("rw", [db.items, db.subjects, db.topics, db.materials, db.meta], async () => {
      // 1. Clear existing items and bulk insert current items
      await Promise.all([
        db.items.clear(),
        db.subjects.clear(),
        db.topics.clear(),
        db.materials.clear(),
      ]);

      if (state.items.length > 0) {
        await db.items.bulkPut(state.items);
      }
      if (state.subjects.length > 0) {
        await db.subjects.bulkPut(state.subjects);
      }
      if (state.topics.length > 0) {
        await db.topics.bulkPut(state.topics);
      }
      if (state.materials.length > 0) {
        await db.materials.bulkPut(state.materials);
      }

      // 2. Put metadata
      await Promise.all([
        db.meta.put({ key: "profile", data: state.profile }),
        db.meta.put({ key: "lastUpdated", data: state.lastUpdated }),
        db.meta.put({ key: "inputs", data: state.inputs }),
      ]);
    });
  } catch (error) {
    console.error("Studidex: Error saving to IndexedDB (Dexie):", error);
  }
}

/**
 * Clears all data from IndexedDB
 */
export async function clearDexieState(): Promise<void> {
  if (!db || typeof window === "undefined") return;

  try {
    await Promise.all([
      db.items.clear(),
      db.subjects.clear(),
      db.topics.clear(),
      db.materials.clear(),
      db.meta.clear(),
    ]);
  } catch (error) {
    console.error("Studidex: Error clearing IndexedDB (Dexie):", error);
  }
}
