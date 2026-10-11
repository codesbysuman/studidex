// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { clearAuthCookie, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    // Also explicitly set cleared cookie on outgoing response headers
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Failed to log out cleanly." },
      { status: 500 }
    );
  }
}
