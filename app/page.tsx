import type { Metadata } from "next";
import HomePageClient from "./home-client";

export const metadata: Metadata = {
  title: "Daily Overview — Personal Study Dashboard",
  description:
    "Your daily overview and personal study dashboard. Real-time view of today's schedule, pending assignments, preparation drills, and academic updates.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}