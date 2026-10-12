// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE_NAME,
  verifySessionToken,
  createTokenPair,
  setAuthCookies,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { authenticated: false, error: "No refresh token provided." },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(refreshToken);
    if (!session) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid or expired refresh token." },
        { status: 401 }
      );
    }

    const tokens = await createTokenPair({
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    });

    await setAuthCookies(tokens);

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Failed to refresh session." },
      { status: 500 }
    );
  }
}
