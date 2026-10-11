// lib/rate-limit.ts
import { NextRequest, NextResponse } from "next/server";

export interface RateLimitOptions {
  limit?: number;       // Max allowed requests in the window
  windowMs?: number;    // Window timeframe in milliseconds (e.g. 60_000 for 1 min)
  keyPrefix?: string;   // Optional prefix to namespace different routes
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;          // Timestamp in ms when the window resets
  retryAfterSeconds: number; // Seconds until client can retry
}

interface WindowRecord {
  prevCount: number;
  currCount: number;
  windowStart: number;
  lastAccessed: number;
}

// Bounded in-memory store using sliding window counter
const MAX_ENTRIES = 10_000;
const store = new Map<string, WindowRecord>();

// Periodic cleanup of stale entries (older than 10 minutes)
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now - record.lastAccessed > 10 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 60 * 1000);

  // Avoid keeping the process alive in Node.js test/CLI environments
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    (cleanupTimer as { unref: () => void }).unref();
  }
}

/**
 * Robust Client IP extraction supporting proxies, CDN, and local dev
 */
export function getClientIp(req: NextRequest): string {
  // 1. Cloudflare
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp)) {
    return cfIp.trim();
  }

  // 2. Standard X-Real-IP
  const realIp = req.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp)) {
    return realIp.trim();
  }

  // 3. Forwarded / X-Forwarded-For
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (isValidIp(firstIp)) {
      return firstIp;
    }
  }

  // 4. Fallback
  return "127.0.0.1";
}

function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  // Basic IPv4 or IPv6 sanity check
  const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(trimmed);
  const isIpv6 = /^[0-9a-fA-F:]+$/.test(trimmed);
  return isIpv4 || isIpv6;
}

/**
 * Sliding Window Counter Rate Limiter
 * Provides smooth, burst-resistant limiting without boundary spikes
 */
export function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 20;
  const windowMs = options.windowMs ?? 60 * 1000;
  const prefix = options.keyPrefix ? `${options.keyPrefix}:` : "";
  const cacheKey = `${prefix}${key}`;
  const now = Date.now();

  // LRU eviction safeguard if store exceeds maximum size
  if (store.size >= MAX_ENTRIES && !store.has(cacheKey)) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, r] of store.entries()) {
      if (r.lastAccessed < oldestTime) {
        oldestTime = r.lastAccessed;
        oldestKey = k;
      }
    }
    if (oldestKey) store.delete(oldestKey);
  }

  const currentWindowStart = Math.floor(now / windowMs) * windowMs;
  let record = store.get(cacheKey);

  if (!record) {
    record = {
      prevCount: 0,
      currCount: 1,
      windowStart: currentWindowStart,
      lastAccessed: now,
    };
    store.set(cacheKey, record);

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: currentWindowStart + windowMs,
      retryAfterSeconds: 0,
    };
  }

  record.lastAccessed = now;

  // Window shift handling
  if (record.windowStart === currentWindowStart) {
    record.currCount += 1;
  } else if (record.windowStart === currentWindowStart - windowMs) {
    record.prevCount = record.currCount;
    record.currCount = 1;
    record.windowStart = currentWindowStart;
  } else {
    record.prevCount = 0;
    record.currCount = 1;
    record.windowStart = currentWindowStart;
  }

  // Calculate sliding estimate
  const timeElapsedInCurrentWindow = now - currentWindowStart;
  const weight = Math.max(0, (windowMs - timeElapsedInCurrentWindow) / windowMs);
  const estimatedCount = Math.floor(record.prevCount * weight) + record.currCount;

  const resetAt = currentWindowStart + windowMs;
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
  const success = estimatedCount <= limit;
  const remaining = Math.max(0, limit - estimatedCount);

  return {
    success,
    limit,
    remaining,
    resetAt,
    retryAfterSeconds,
  };
}

/**
 * Standard HTTP headers for rate limiting (RFC / IETF draft standard)
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.success) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

/**
 * Convenient helper to return a standard 429 response with appropriate headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  return NextResponse.json(
    {
      error: customMessage || "Too many requests. Please slow down and try again shortly.",
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: getRateLimitHeaders(result),
    }
  );
}
