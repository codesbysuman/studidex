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

export default function ActionsPage() {
  return <ActionsClient />;
}
