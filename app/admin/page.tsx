import type { Metadata } from "next";
import AdminClient from "./admin-client";
import { getServerStudidexData } from "@/lib/server/studidex-server";

export const metadata: Metadata = {
  title: "Admin Content Curation & Discovery — Studidex",
  description:
    "Administrator portal for managing cloud-synced materials, setting public discovery in personalized feeds, and configuring content access models.",
  alternates: {
    canonical: "/admin",
  },
};

export default async function AdminPage() {
  const { user } = await getServerStudidexData();
  return <AdminClient initialUser={user} />;
}
