import type { Metadata } from "next";
import AddClient from "./add-client";

export const metadata: Metadata = {
  title: "Add & Organize Studies",
  description:
    "Quickly add assignments, exams, classes, and study notes, or import class schedules into Studidex.",
  alternates: {
    canonical: "/add",
  },
};

export default function AddPage() {
  return <AddClient />;
}
