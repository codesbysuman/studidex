// app/api/materials/public/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { rateLimit, getClientIp, createRateLimitResponse, getRateLimitHeaders } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`public-materials:${ip}`, {
      limit: 120,
      windowMs: 60 * 1000,
      keyPrefix: "materials",
    });

    if (!limit.success) {
      return createRateLimitResponse(limit);
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return NextResponse.json(
        { materials: [], databaseOffline: true },
        { headers: getRateLimitHeaders(limit) }
      );
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage")?.toLowerCase();
    const board = searchParams.get("board")?.toLowerCase();
    const query = searchParams.get("q")?.toLowerCase();
    const type = searchParams.get("type");

    // Fetch all materials from cloud DB
    const allMaterials = await prisma.material.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            stage: true,
            className: true,
            examiningBody: true,
            board: true,
            institutionName: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    // Filter to only public materials
    const publicMaterials = allMaterials
      .filter((m) => {
        const meta = (m.metadata as any) || {};
        return Boolean(meta.isPublic === true);
      })
      .map((m) => {
        const meta = (m.metadata as any) || {};
        const matStage = (meta.stage || m.user.stage || "").toLowerCase();
        const matBoard = (meta.board || m.user.board || m.user.examiningBody || "").toLowerCase();
        const matSubject = meta.subjectName || m.subject?.name || "";

        // Calculate relevance match score if student profile parameters provided
        let relevanceScore = 0;
        if (stage && matStage.includes(stage)) relevanceScore += 30;
        if (board && matBoard.includes(board)) relevanceScore += 30;
        if (query) {
          const q = query.toLowerCase();
          if (m.title.toLowerCase().includes(q)) relevanceScore += 40;
          if (m.description?.toLowerCase().includes(q)) relevanceScore += 20;
          if (matSubject.toLowerCase().includes(q)) relevanceScore += 25;
        }

        return {
          id: m.id,
          title: m.title,
          description: m.description,
          type: m.type,
          origin: m.origin,
          content: m.content,
          testData: m.testData,
          metadata: meta,
          isPublic: true,
          isPaid: Boolean(meta.isPaid),
          price: typeof meta.price === "number" ? meta.price : 0,
          downloadCount: typeof meta.downloadCount === "number" ? meta.downloadCount : 0,
          stage: meta.stage || m.user.stage || "UG",
          board: meta.board || m.user.examiningBody || m.user.board || "Curated",
          stream: meta.stream || null,
          subjectName: matSubject || "General Academic",
          authorName: meta.authorName || m.user.name || "Curated Faculty",
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
          relevanceScore,
        };
      });

    // Optional filtering by type
    let filtered = publicMaterials;
    if (type && type !== "all") {
      filtered = filtered.filter((m) => m.type === type);
    }

    // Sort by relevance score, then by download count
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore || b.downloadCount - a.downloadCount);

    return NextResponse.json(
      {
        success: true,
        count: filtered.length,
        materials: filtered,
      },
      { headers: getRateLimitHeaders(limit) }
    );
  } catch (error) {
    console.error("Public materials error:", error);
    return NextResponse.json(
      { error: "Failed to fetch public materials." },
      { status: 500 }
    );
  }
}
