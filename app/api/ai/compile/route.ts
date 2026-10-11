// app/api/ai/compile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { compileAcademicMaterialWithGroq } from "@/lib/groq";
import { validateImportJson } from "@/lib/core/validate";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`ai-compile:${ip}`, {
      limit: 20,
      windowMs: 60 * 1000,
      keyPrefix: "ai",
    });

    if (!limit.success) {
      return createRateLimitResponse(
        limit,
        "Too many AI requests. Please wait a few moments before trying again."
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

    const { input, profileContext } = body || {};

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json(
        { error: "Academic text input is required." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    // Limit input length to protect against resource exhaustion
    if (input.length > 50_000) {
      return NextResponse.json(
        { error: "Input text exceeds maximum allowed length (50,000 characters)." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const safeProfileContext =
      typeof profileContext === "string" ? profileContext.slice(0, 5000) : undefined;

    const compiledJson = await compileAcademicMaterialWithGroq(input, safeProfileContext);

    // Validate with Studidex core validator
    const stringified = JSON.stringify(compiledJson);
    const validation = validateImportJson(stringified);

    return NextResponse.json(
      {
        success: true,
        raw: compiledJson,
        validation,
        normalizedPayload: validation.normalizedPayload || compiledJson,
      },
      { headers: getRateLimitHeaders(limit) }
    );
  } catch (error: any) {
    console.error("AI Compile error:", error);
    return NextResponse.json(
      {
        error: "Unable to organize text right now. Please try again or add items manually.",
      },
      { status: 500 }
    );
  }
}
