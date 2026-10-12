import type { Metadata } from "next";
import { INITIAL_STUDIDEX_STATE } from "@/lib/core/sample-data";
import { getServerStudidexData } from "@/lib/server/studidex-server";
import PreparationViewClient from "./prepare-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { state } = await getServerStudidexData();
  const item =
    state.items.find((i) => i.id === id) ||
    INITIAL_STUDIDEX_STATE.items.find((i) => i.id === id);

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

export default async function PreparationViewPage({ params }: Props) {
  const { id } = await params;
  const { user, state, isDbConnected } = await getServerStudidexData();
  return (
    <PreparationViewClient
      id={id}
      initialUser={user}
      initialState={state}
      isDbConnected={isDbConnected}
    />
  );
}
