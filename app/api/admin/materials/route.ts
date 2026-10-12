// app/api/admin/materials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { getAuthSession, verifyAdminAccess } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!verifyAdminAccess(req, session)) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database offline", databaseOffline: true },
        { status: 503 }
      );
    }

    // High performance query with selective projection
    const [materials, totalUsers, totalItems, totalAttempts] = await Promise.all([
      prisma.material.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          origin: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          testData: true,
          content: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              stage: true,
              board: true,
              institutionName: true,
            },
          },
          subject: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
      prisma.academicItem.count(),
      prisma.mockTestAttempt.count(),
    ]);

    const formatted = materials.map((m) => {
      const meta = (m.metadata as any) || {};
      const fullContent = m.content || "";
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        origin: m.origin,
        isPublic: Boolean(meta.isPublic),
        isPaid: Boolean(meta.isPaid),
        price: typeof meta.price === "number" ? meta.price : 0,
        downloadCount: typeof meta.downloadCount === "number" ? meta.downloadCount : 0,
        stage: meta.stage || m.user.stage || "UG",
        board: meta.board || m.user.board || "General",
        subjectName: meta.subjectName || m.subject?.name || "Uncategorized",
        authorEmail: m.user.email,
        authorName: meta.authorName || m.user.name || "Student",
        authorInstitution: m.user.institutionName || null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        contentExcerpt: fullContent.length > 280 ? fullContent.slice(0, 280) + "..." : fullContent,
        contentLength: fullContent.length,
        hasQuiz: Boolean(m.testData),
      };
    });

    const publicCount = formatted.filter((m) => m.isPublic).length;
    const paidCount = formatted.filter((m) => m.isPaid).length;
    const totalDownloads = formatted.reduce((acc, m) => acc + m.downloadCount, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalMaterials: materials.length,
        publicMaterials: publicCount,
        paidMaterials: paidCount,
        totalUsers,
        totalItems,
        totalAttempts,
        totalDownloads,
      },
      materials: formatted,
    });
  } catch (error) {
    console.error("Admin materials GET error:", error);
    return NextResponse.json({ error: "Failed to load admin materials." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!verifyAdminAccess(req, session)) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database offline", databaseOffline: true },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { id, title, isPublic, isPaid, price, stage, board, subjectName } = body || {};

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Material ID is required." }, { status: 400 });
    }

    const material = await prisma.material.findUnique({
      where: { id },
      select: { id: true, title: true, metadata: true },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const currentMeta = (material.metadata as any) || {};
    const updatedMeta = {
      ...currentMeta,
      ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {}),
      ...(isPaid !== undefined ? { isPaid: Boolean(isPaid) } : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(stage !== undefined ? { stage: String(stage) } : {}),
      ...(board !== undefined ? { board: String(board) } : {}),
      ...(subjectName !== undefined ? { subjectName: String(subjectName) } : {}),
    };

    const updateData: any = { metadata: updatedMeta };
    if (title && typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }

    const updated = await prisma.material.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Material permissions and public discovery updated successfully.",
      material: {
        id: updated.id,
        title: updated.title,
        metadata: updatedMeta,
      },
    });
  } catch (error) {
    console.error("Admin materials PATCH error:", error);
    return NextResponse.json({ error: "Failed to update material status." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!verifyAdminAccess(req, session)) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database offline", databaseOffline: true },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Material ID is required." }, { status: 400 });
    }

    // Cascade or delete attempts first if any
    await prisma.mockTestAttempt.deleteMany({
      where: { materialId: id },
    });

    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Material removed successfully from cloud index.",
    });
  } catch (error) {
    console.error("Admin materials DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete material." }, { status: 500 });
  }
}
