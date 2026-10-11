// app/api/ai/quiz/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateMockQuestionsWithGroq } from "@/lib/groq";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`ai-quiz:${ip}`, {
      limit: 15,
      windowMs: 60 * 1000,
      keyPrefix: "ai",
    });

    if (!limit.success) {
      return createRateLimitResponse(
        limit,
        "Too many mock test requests. Please wait a moment before trying again."
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

    const { subject, topics, difficulty, questionCount } = body || {};

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json(
        { error: "Subject is required to generate a mock test." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const safeSubject = subject.trim().slice(0, 150);
    const safeTopics = Array.isArray(topics)
      ? topics.filter((t): t is string => typeof t === "string" && Boolean(t.trim())).slice(0, 30)
      : [];
    const safeDifficulty = ["easy", "medium", "hard"].includes(difficulty)
      ? difficulty
      : "medium";
    const safeQuestionCount = Math.max(1, Math.min(20, Number(questionCount) || 5));

    const testData = await generateMockQuestionsWithGroq({
      subject: safeSubject,
      topics: safeTopics,
      difficulty: safeDifficulty,
      questionCount: safeQuestionCount,
    });

    return NextResponse.json(
      { success: true, testData },
      { headers: getRateLimitHeaders(limit) }
    );
  } catch (error: any) {
    console.error("AI Quiz error:", error);
    return NextResponse.json(
      {
        error: "Unable to generate mock exam right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
