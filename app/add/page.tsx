import type { Metadata } from "next";
import AddClient from "./add-client";

export const metadata: Metadata = {
  title: "Import & Add Course Data",
  description:
    "Seamlessly import course syllabi, JSON envelopes, timetable schedules, and assignments into Studidex.",
  alternates: {
    canonical: "/add",
  },
};

export default function AddPage() {
  return <AddClient />;
}
