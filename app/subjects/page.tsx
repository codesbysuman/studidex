// app/subjects/page.tsx
import type { Metadata } from "next";
import SubjectsPageClient from "./subjects-client";

export const metadata: Metadata = {
    title: "Subjects & Papers | Studidex",
    description: "Overview of your active academic subjects, papers, syllabus units, and materials.",
};

import { getServerStudidexData } from "@/lib/server/studidex-server";

export default async function SubjectsPage() {
    const { user, state, isDbConnected } = await getServerStudidexData();
    return <SubjectsPageClient initialUser={user} initialState={state} isDbConnected={isDbConnected} />;
}
