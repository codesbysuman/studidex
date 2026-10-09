import type { Metadata } from "next";
import ProfileClient from "./profile-client";

export const metadata: Metadata = {
    title: "Academic Profile & Specialization — Studidex",
    description:
        "Personalize your academic profile, education stage (School, HS, UG, PG), affiliated examining body, university, degree specialization, papers (CC, DSE, SEC, GE), and curriculum.",
    alternates: {
        canonical: "/profile",
    },
};

export default function ProfilePage() {
    return <ProfileClient />;
}
