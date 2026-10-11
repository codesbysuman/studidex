// lib/core/sample-data.ts
import { StudidexState } from "./types";

export const INITIAL_STUDIDEX_STATE: StudidexState = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    profile: {
        name: "",
        stage: "ug",
        hasCompletedOnboarding: true,
        papers: [],
    },
    subjects: [],
    topics: [],
    inputs: [],
    items: [],
    materials: [],
};

// Aliased to initial empty state to prevent any demo data injection in production
export const DEMO_STUDIDEX_STATE: StudidexState = INITIAL_STUDIDEX_STATE;
export const SAMPLE_STUDIDEX_STATE: StudidexState = INITIAL_STUDIDEX_STATE;
