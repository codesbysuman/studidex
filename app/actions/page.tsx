import type { Metadata } from "next";
import ActionsClient from "./actions-client";

export const metadata: Metadata = {
  title: "Actions & Deliverables",
  description:
    "Track coursework assignments, project milestones, checklist deliverables, and submission deadlines across all your subjects.",
  alternates: {
    canonical: "/actions",
  },
};

import { getServerStudidexData } from "@/lib/server/studidex-server";

export default async function ActionsPage() {
  const { user, state, isDbConnected } = await getServerStudidexData();
  return <ActionsClient initialUser={user} initialState={state} isDbConnected={isDbConnected} />;
}
