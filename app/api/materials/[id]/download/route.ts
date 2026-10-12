// app/api/materials/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Material ID is required." }, { status: 400 });
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database temporarily unavailable for download tracking." },
        { status: 503 }
      );
    }

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        subject: true,
        user: {
          select: { name: true, stage: true, examiningBody: true, institutionName: true },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const meta = (material.metadata as any) || {};
    const isPaid = Boolean(meta.isPaid);

    if (isPaid) {
      return NextResponse.json(
        {
          error: "This is a premium academic resource and cannot be downloaded without purchase.",
          isPaid: true,
          price: meta.price || 0,
        },
        { status: 403 }
      );
    }

    // Increment download count in metadata
    const nextDownloadCount = (typeof meta.downloadCount === "number" ? meta.downloadCount : 0) + 1;
    const updatedMeta = {
      ...meta,
      downloadCount: nextDownloadCount,
    };

    await prisma.material.update({
      where: { id },
      data: { metadata: updatedMeta },
    });

    // Build clean download document
    const questionsText =
      material.testData && Array.isArray((material.testData as any).questions)
        ? (material.testData as any).questions
            .map(
              (q: any, idx: number) =>
                `\n### Question ${idx + 1} (${q.marks} marks)\n${q.question}\nOptions:\n${q.options
                  .map((opt: string, i: number) => ` - [${String.fromCharCode(65 + i)}] ${opt}`)
                  .join("\n")}`
            )
            .join("\n")
        : "";

    const formattedDocument = [
      `# ${material.title}`,
      `**Type**: ${material.type.toUpperCase()} | **Origin**: ${material.origin}`,
      material.subject ? `**Subject**: ${material.subject.name}` : null,
      meta.authorName || material.user.name ? `**Author/Faculty**: ${meta.authorName || material.user.name}` : null,
      meta.board ? `**Board/Examining Body**: ${meta.board}` : null,
      `---`,
      material.description ? `\n> ${material.description}\n` : null,
      material.content || "",
      questionsText,
      `\n---`,
      `*Indexed and generated via Studidex — Your Academic Life, Indexed.*`,
    ]
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({
      success: true,
      downloadCount: nextDownloadCount,
      filename: `${material.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.md`,
      content: formattedDocument,
      rawContent: material.content,
      testData: material.testData,
    });
  } catch (error) {
    console.error("Download material error:", error);
    return NextResponse.json(
      { error: "Failed to download material." },
      { status: 500 }
    );
  }
}
