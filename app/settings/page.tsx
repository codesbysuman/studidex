import type { Metadata } from "next";
import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: "Settings & Workspace Preferences",
  description:
    "Manage storage, load sample datasets, export academic data, and configure preferences for Studidex.",
  alternates: {
    canonical: "/settings",
  },
};

import { getServerStudidexData } from "@/lib/server/studidex-server";

export default async function SettingsPage() {
  const { user, state, isDbConnected } = await getServerStudidexData();
  return <SettingsClient initialUser={user} initialState={state} isDbConnected={isDbConnected} />;
}
