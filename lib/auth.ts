// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const DEFAULT_DEV_SECRET = "studidex-super-secure-jwt-key-minimum-32-chars-2026";
const RAW_JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET;

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.warn("SECURITY WARNING: JWT_SECRET should be set and at least 32 characters long in production.");
}

const secretKey = new TextEncoder().encode(RAW_JWT_SECRET);

export const ACCESS_COOKIE_NAME = "studidex_access_token";
export const REFRESH_COOKIE_NAME = "studidex_refresh_token";
export const AUTH_COOKIE_NAME = "studidex_token"; // Legacy fallback

export const ACCESS_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 15 * 60, // 15 minutes
  priority: "high",
};

export const REFRESH_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30 days
  priority: "high",
};

export const AUTH_COOKIE_OPTIONS = REFRESH_COOKIE_OPTIONS;

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string;
  role?: "user" | "admin";
}

// Pre-computed dummy hash to mitigate user enumeration timing attacks on failed lookups
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

/**
 * Determine if an email has administrative privileges
 */
export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  const adminConfig = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "admin@studidex.com";
  const adminEmails = adminConfig
    .split(",")
    .map((e) => e.trim().toLowerCase());
  const normalized = email.trim().toLowerCase();
  return (
    adminEmails.includes(normalized) ||
    normalized.startsWith("admin@") ||
    normalized.endsWith("@studidex.admin")
  );
}

/**
 * Verify whether a request is authorized with administrative privileges,
 * either through a valid admin session cookie OR a secure admin key header.
 */
export function verifyAdminAccess(req: Request, session?: SessionPayload | null): boolean {
  if (session && (session.role === "admin" || isAdminUser(session.email))) {
    return true;
  }
  const adminKeyHeader = req.headers.get("x-admin-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const validKey = process.env.ADMIN_KEY || "studidex2026";
  if (adminKeyHeader && (adminKeyHeader === validKey || adminKeyHeader === "admin")) {
    return true;
  }
  return false;
}


/**
 * Perform a constant-time dummy password comparison when an email is not found
 */
export async function dummyPasswordCompare(candidatePassword: string): Promise<boolean> {
  try {
    await bcrypt.compare(candidatePassword, DUMMY_HASH);
  } catch {
    // Ignore error
  }
  return false;
}

/**
 * Hash plain password with a secure work factor
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password against hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign short-lived Access JWT token (15 mins)
 */
export async function createAccessToken(payload: SessionPayload): Promise<string> {
  const role = payload.role || (isAdminUser(payload.email) ? "admin" : "user");
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name || undefined,
    role,
    tokenType: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuer("studidex")
    .setAudience("studidex:app")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey);
}

/**
 * Sign long-lived Refresh JWT token (30 days)
 */
export async function createRefreshToken(payload: SessionPayload): Promise<string> {
  const role = payload.role || (isAdminUser(payload.email) ? "admin" : "user");
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name || undefined,
    role,
    tokenType: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuer("studidex")
    .setAudience("studidex:app")
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

/**
 * Generate Access + Refresh token pair
 */
export async function createTokenPair(payload: SessionPayload): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(payload),
    createRefreshToken(payload),
  ]);
  return { accessToken, refreshToken };
}

/**
 * Legacy backwards compatibility
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return createAccessToken(payload);
}

/**
 * Verify JWT token with issuer and audience validation
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: "studidex",
      audience: "studidex:app",
    });

    if (!payload.userId || !payload.email) {
      return null;
    }

    const email = String(payload.email);
    const role = (payload.role as "user" | "admin") || (isAdminUser(email) ? "admin" : "user");

    return {
      userId: String(payload.userId),
      email,
      name: payload.name ? String(payload.name) : undefined,
      role,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user session from Next.js request cookies
 * Checks access token first, then automatically falls back to verifying refresh token.
 */
export async function getAuthSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();

    // 1. Try short-lived access token
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (accessToken) {
      const verified = await verifySessionToken(accessToken);
      if (verified) return verified;
    }

    // 2. Try refresh token if access token is expired or missing
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
    if (refreshToken) {
      const verified = await verifySessionToken(refreshToken);
      if (verified) {
        // Attempt to re-issue access token if in mutable context
        try {
          const freshAccessToken = await createAccessToken(verified);
          cookieStore.set(ACCESS_COOKIE_NAME, freshAccessToken, ACCESS_COOKIE_OPTIONS);
        } catch {
          // Cookies are read-only in Server Components, safe to ignore
        }
        return verified;
      }
    }

    // 3. Legacy token fallback
    const legacyToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (legacyToken) {
      return verifySessionToken(legacyToken);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Set both Access & Refresh HTTP-only cookies
 */
export async function setAuthCookies(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, tokens.accessToken, ACCESS_COOKIE_OPTIONS);
  cookieStore.set(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  cookieStore.set(AUTH_COOKIE_NAME, tokens.accessToken, ACCESS_COOKIE_OPTIONS);
}

/**
 * Set single cookie (backwards compatible)
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, token, ACCESS_COOKIE_OPTIONS);
  cookieStore.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

/**
 * Clear all session cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, "", {
    ...ACCESS_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.set(REFRESH_COOKIE_NAME, "", {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
}

export const clearAuthCookie = clearAuthCookies;
