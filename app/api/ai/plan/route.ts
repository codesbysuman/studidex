// app/api/ai/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateStudyPlanWithGroq } from "@/lib/groq";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`ai-plan:${ip}`, {
      limit: 15,
      windowMs: 60 * 1000,
      keyPrefix: "ai",
    });

    if (!limit.success) {
      return createRateLimitResponse(
        limit,
        "Too many study plan requests. Please wait a moment before trying again."
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const { targetExam, subject, daysAvailable, topics, hoursPerDay } = body || {};

    if (!targetExam || typeof targetExam !== "string" || !targetExam.trim()) {
      return NextResponse.json(
        { error: "Target exam is required." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const safeTargetExam = targetExam.trim().slice(0, 150);
    const safeSubject = subject.trim().slice(0, 150);
    const safeDays = Math.max(1, Math.min(365, Number(daysAvailable) || 7));
    const safeHours = Math.max(1, Math.min(24, Number(hoursPerDay) || 3));
    const safeTopics = Array.isArray(topics)
      ? topics.filter((t): t is string => typeof t === "string" && Boolean(t.trim())).slice(0, 50)
      : [];

    const plan = await generateStudyPlanWithGroq({
      targetExam: safeTargetExam,
      subject: safeSubject,
      daysAvailable: safeDays,
      topics: safeTopics,
      hoursPerDay: safeHours,
    });

    return NextResponse.json(
      { success: true, plan },
      { headers: getRateLimitHeaders(limit) }
    );
  } catch (error: any) {
    console.error("AI Plan error:", error);
    return NextResponse.json(
      {
        error: "Unable to generate study plan right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
