import type { Metadata } from "next";
import UpdatesClient from "./updates-client";

export const metadata: Metadata = {
  title: "Academic Updates & Notices",
  description:
    "Real-time feed of departmental announcements, schedule adjustments, exam dates, and academic opportunities.",
  alternates: {
    canonical: "/updates",
  },
};

export default function UpdatesPage() {
  return <UpdatesClient />;
}
