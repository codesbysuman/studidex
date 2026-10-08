import type { Metadata } from "next";
import { INITIAL_STUDIDEX_STATE } from "@/lib/core/sample-data";
import PreparationViewClient from "./prepare-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = INITIAL_STUDIDEX_STATE.items.find((i) => i.id === id);

  const title = item ? `Prepare: ${item.title}` : "Exam & Assessment Preparation";
  const description =
    item?.description ||
    "Interactive exam preparation cockpit, high-yield topics checklist, and mock drills.";

  return {
    title,
    description,
    alternates: {
      canonical: `/prepare/${id}`,
    },
    openGraph: {
      title: `${title} | Studidex`,
      description,
    },
  };
}

export default function PreparationViewPage({ params }: Props) {
  return <PreparationViewClient params={params} />;
}
