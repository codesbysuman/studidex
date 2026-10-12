import type { Metadata } from "next";
import PlanClient from "./plan-client";

export const metadata: Metadata = {
  title: "Plan & Schedule",
  description:
    "Unified academic schedule, weekly agenda, lecture hours, and syllabus progression timeline.",
  alternates: {
    canonical: "/plan",
  },
};

import { getServerStudidexData } from "@/lib/server/studidex-server";

export default async function PlanPage() {
  const { user, state, isDbConnected } = await getServerStudidexData();
  return <PlanClient initialUser={user} initialState={state} isDbConnected={isDbConnected} />;
}
