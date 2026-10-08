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

export default function PlanPage() {
  return <PlanClient />;
}
