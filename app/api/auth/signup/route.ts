// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { hashPassword, createTokenPair, setAuthCookies, isAdminUser } from "@/lib/auth";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STAGES = ["school", "hs", "ug", "pg", "phd"];

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`signup:${ip}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000, // 8 signups per 15 minutes
      keyPrefix: "auth",
    });

    if (!limit.success) {
      return createRateLimitResponse(
        limit,
        "Too many sign up attempts. Please try again after a few minutes."
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

    const {
      email,
      password,
      name,
      stage,
      className,
      examiningBody,
      institutionName,
      specialization,
    } = body || {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const emailNormalized = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(emailNormalized) || emailNormalized.length > 255) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 6 and 128 characters long." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    // Sanitize optional fields
    const safeName = typeof name === "string" ? name.trim().slice(0, 100) : "Student";
    const safeStage = typeof stage === "string" && ALLOWED_STAGES.includes(stage) ? stage : "ug";
    const safeClassName = typeof className === "string" ? className.trim().slice(0, 100) : undefined;
    const safeExaminingBody = typeof examiningBody === "string" ? examiningBody.trim().slice(0, 150) : undefined;
    const safeInstitutionName = typeof institutionName === "string" ? institutionName.trim().slice(0, 150) : undefined;
    const safeSpecialization = typeof specialization === "string" ? specialization.trim().slice(0, 150) : undefined;

    // Check database connection
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

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409, headers: getRateLimitHeaders(limit) }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: emailNormalized,
        passwordHash,
        name: safeName || "Student",
        stage: safeStage,
        className: safeClassName,
        examiningBody: safeExaminingBody,
        institutionName: safeInstitutionName,
        specialization: safeSpecialization,
        hasCompletedOnboarding: true,
      },
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
      },
    });

    const tokens = await createTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
    });

    await setAuthCookies(tokens);

    return NextResponse.json(
      {
        success: true,
        user: { ...user, role: isAdminUser(user.email) ? "admin" : "user" },
      },
      {
        status: 201,
        headers: getRateLimitHeaders(limit),
      }
    );
  } catch (error: any) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: "An error occurred during account creation. Please try again." },
      { status: 500 }
    );
  }
}
