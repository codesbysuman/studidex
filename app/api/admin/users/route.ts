// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { getAuthSession, verifyAdminAccess, isAdminUser } from "@/lib/auth";

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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        stage: true,
        board: true,
        degree: true,
        className: true,
        institutionName: true,
        stream: true,
        hasCompletedOnboarding: true,
        papers: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            materials: true,
            items: true,
            subjects: true,
            testAttempts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = users.map((u) => {
      let paperCount = 0;
      if (Array.isArray(u.papers)) {
        paperCount = u.papers.length;
      }
      return {
        id: u.id,
        email: u.email,
        name: u.name || "Student",
        stage: u.stage || "UG",
        board: u.board || "General",
        degree: u.degree || null,
        className: u.className || null,
        institutionName: u.institutionName || "Not Specified",
        stream: u.stream || null,
        hasCompletedOnboarding: u.hasCompletedOnboarding,
        paperCount,
        materialCount: u._count.materials,
        itemCount: u._count.items,
        subjectCount: u._count.subjects,
        attemptCount: u._count.testAttempts,
        isAdmin: isAdminUser(u.email),
        createdAt: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      totalUsers: formatted.length,
      users: formatted,
    });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Failed to load users list." }, { status: 500 });
  }
}
