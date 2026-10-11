// app/api/ai/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateMaterialSummaryWithGroq } from "@/lib/groq";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`ai-summarize:${ip}`, {
      limit: 15,
      windowMs: 60 * 1000,
      keyPrefix: "ai",
    });

    if (!limit.success) {
      return createRateLimitResponse(
        limit,
        "Too many summarization requests. Please wait a moment before trying again."
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

    const { title, subject, content } = body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required to summarize." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required to summarize." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    if (content.length > 50_000) {
      return NextResponse.json(
        { error: "Content exceeds maximum length (50,000 characters)." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const safeTitle = title.trim().slice(0, 200);
    const safeSubject = typeof subject === "string" ? subject.trim().slice(0, 150) : undefined;

    const summaryData = await generateMaterialSummaryWithGroq({
      title: safeTitle,
      subject: safeSubject,
      content,
    });

    return NextResponse.json(
      { success: true, summary: summaryData },
      { headers: getRateLimitHeaders(limit) }
    );
  } catch (error: any) {
    console.error("AI Summarize error:", error);
    return NextResponse.json(
      {
        error: "Unable to summarize material right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
