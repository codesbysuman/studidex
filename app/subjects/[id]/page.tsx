import type { Metadata } from "next";
import { INITIAL_STUDIDEX_STATE } from "@/lib/core/sample-data";
import { getServerStudidexData } from "@/lib/server/studidex-server";
import SubjectDetailClient from "./subject-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { state } = await getServerStudidexData();
  const subject =
    state.subjects.find((s) => s.id === id) ||
    INITIAL_STUDIDEX_STATE.subjects.find((s) => s.id === id);

  const title = subject ? `${subject.name} (${subject.code})` : "Subject Details";
  const description =
    subject?.description ||
    "Subject syllabus progression, topic modules, class timetable, and linked study materials.";

  return {
    title,
    description,
    alternates: {
      canonical: `/subjects/${id}`,
    },
    openGraph: {
      title: `${title} | Studidex`,
      description,
    },
  };
}

export default async function SubjectDetailPage({ params }: Props) {
  const { id } = await params;
  const { user, state, isDbConnected } = await getServerStudidexData();
  return (
    <SubjectDetailClient
      id={id}
      initialUser={user}
      initialState={state}
      isDbConnected={isDbConnected}
    />
  );
}
