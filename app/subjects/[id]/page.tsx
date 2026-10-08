import type { Metadata } from "next";
import { INITIAL_STUDIDEX_STATE } from "@/lib/core/sample-data";
import SubjectDetailClient from "./subject-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const subject = INITIAL_STUDIDEX_STATE.subjects.find((s) => s.id === id);

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

export default function SubjectDetailPage({ params }: Props) {
  return <SubjectDetailClient params={params} />;
}
