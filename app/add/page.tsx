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

import { getServerStudidexData } from "@/lib/server/studidex-server";

export default async function AddPage() {
  const { user, state, isDbConnected } = await getServerStudidexData();
  return <AddClient initialUser={user} initialState={state} isDbConnected={isDbConnected} />;
}
