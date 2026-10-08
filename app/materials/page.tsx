import type { Metadata } from "next";
import MaterialsClient from "./materials-client";

export const metadata: Metadata = {
  title: "Academic Library & Materials",
  description:
    "Organized repository of course textbooks, lecture notes, syllabus sheets, and mock tests indexed by subject.",
  alternates: {
    canonical: "/materials",
  },
};

export default function MaterialsPage() {
  return <MaterialsClient />;
}
