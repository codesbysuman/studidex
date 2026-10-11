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

export const AUTH_COOKIE_NAME = "studidex_token";

export const AUTH_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30 days
  priority: "high",
};

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string;
}

// Pre-computed dummy hash to mitigate user enumeration timing attacks on failed lookups
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

/**
 * Perform a constant-time dummy password comparison when an email is not found
 * to protect against user enumeration via response timing differences.
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
 * Sign JWT token with standard claims (iss, aud, sub, iat, exp)
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name || undefined,
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

    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: payload.name ? String(payload.name) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user session from Next.js request cookies
 */
export async function getAuthSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Set HTTP-only cookie with secure attributes
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

/**
 * Clear the session cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
}
