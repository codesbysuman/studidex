// app/api/admin/system/route.ts
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

    const startTime = Date.now();
    const dbAvailable = await checkDatabaseConnection();
    const dbLatencyMs = Date.now() - startTime;

    if (!dbAvailable) {
      return NextResponse.json({
        success: false,
        status: "degraded",
        database: {
          connected: false,
          latencyMs: null,
          engine: "Neon PostgreSQL",
        },
      });
    }

    const [userCount, subjectCount, topicCount, itemCount, materialCount, attemptCount, inputCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.subject.count(),
        prisma.topic.count(),
        prisma.academicItem.count(),
        prisma.material.count(),
        prisma.mockTestAttempt.count(),
        prisma.academicInput.count(),
      ]);

    return NextResponse.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs: dbLatencyMs,
        provider: "Neon PostgreSQL / Prisma ORM",
      },
      counts: {
        users: userCount,
        subjects: subjectCount,
        topics: topicCount,
        academicItems: itemCount,
        materials: materialCount,
        mockTestAttempts: attemptCount,
        academicInputs: inputCount,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        hasGroqKey: Boolean(process.env.GROQ_API_KEY),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
      },
    });
  } catch (error) {
    console.error("Admin system GET error:", error);
    return NextResponse.json(
      { success: false, error: "System diagnostic failed." },
      { status: 500 }
    );
  }
}
