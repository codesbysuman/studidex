import type { Metadata } from "next";
import HomePageClient from "./home-client";

export const metadata: Metadata = {
  title: "Command Center — Real-Time Academic Overview",
  description:
    "Your academic command center. Real-time overview of today's schedule, pending assignments, preparation drills, and urgent updates.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}