// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import {
  comparePassword,
  createSessionToken,
  setAuthCookie,
  dummyPasswordCompare,
} from "@/lib/auth";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`login:${ip}`, {
      limit: 15,
      windowMs: 15 * 60 * 1000, // 15 attempts per 15 minutes
      keyPrefix: "auth",
    });

    if (!limit.success) {
      return createRateLimitResponse(
        limit,
        "Too many login attempts. Please wait a few minutes before trying again."
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const { email, password } = body || {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const emailNormalized = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(emailNormalized) || emailNormalized.length > 255) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 6 and 128 characters." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    // Check database connectivity
    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return NextResponse.json(
        {
          error: "Cloud sync is temporarily unavailable. Your study data remains safe on this device.",
          databaseOffline: true,
        },
        { status: 503, headers: getRateLimitHeaders(limit) }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      // Prevent user enumeration timing attack
      await dummyPasswordCompare(password);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401, headers: getRateLimitHeaders(limit) }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401, headers: getRateLimitHeaders(limit) }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
    });

    await setAuthCookie(token);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      stage: user.stage,
      className: user.className,
      degree: user.degree,
      examiningBody: user.examiningBody,
      board: user.board,
      medium: user.medium,
      institutionName: user.institutionName,
      center: user.center,
      stream: user.stream,
      specialization: user.specialization,
      minorSpecialization: user.minorSpecialization,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    };

    return NextResponse.json(
      {
        success: true,
        user: safeUser,
      },
      {
        status: 200,
        headers: getRateLimitHeaders(limit),
      }
    );
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
