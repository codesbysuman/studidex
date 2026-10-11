// app/subjects/page.tsx
import type { Metadata } from "next";
import SubjectsPageClient from "./subjects-client";

export const metadata: Metadata = {
    title: "Subjects & Papers | Studidex",
    description: "Overview of your active academic subjects, papers, syllabus units, and materials.",
};

export default function SubjectsPage() {
    return <SubjectsPageClient />;
}
