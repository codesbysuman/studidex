import type { Metadata } from "next";
import { INITIAL_STUDIDEX_STATE } from "@/lib/core/sample-data";
import MaterialDetailClient from "./material-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const material = INITIAL_STUDIDEX_STATE.materials.find((m) => m.id === id);

  const title = material ? material.title : "Study Material Details";
  const description =
    material?.description ||
    "Course textbooks, lecture slide decks, syllabus documents, and mock test drills.";

  return {
    title,
    description,
    alternates: {
      canonical: `/materials/${id}`,
    },
    openGraph: {
      title: `${title} | Studidex`,
      description,
    },
  };
}

export default function MaterialDetailPage({ params }: Props) {
  return <MaterialDetailClient params={params} />;
}
