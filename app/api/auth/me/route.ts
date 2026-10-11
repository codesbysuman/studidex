// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { rateLimit, getClientIp, createRateLimitResponse, getRateLimitHeaders } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`auth-me:${ip}`, {
      limit: 120,
      windowMs: 60 * 1000,
      keyPrefix: "auth",
    });

    if (!limit.success) {
      return createRateLimitResponse(limit);
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { headers: getRateLimitHeaders(limit) }
      );
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      // If DB is temporarily unavailable, return session payload safely
      return NextResponse.json(
        {
          authenticated: true,
          user: { id: session.userId, email: session.email, name: session.name },
          databaseOffline: true,
        },
        { headers: getRateLimitHeaders(limit) }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        stage: true,
        className: true,
        degree: true,
        examiningBody: true,
        board: true,
        medium: true,
        institutionName: true,
        center: true,
        stream: true,
        specialization: true,
        minorSpecialization: true,
        hasCompletedOnboarding: true,
        papers: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { headers: getRateLimitHeaders(limit) }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user,
        databaseOffline: false,
      },
      { headers: getRateLimitHeaders(limit) }
    );
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Could not retrieve user session." },
      { status: 500 }
    );
  }
}
