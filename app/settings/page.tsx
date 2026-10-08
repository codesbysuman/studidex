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

export default function SettingsPage() {
  return <SettingsClient />;
}
