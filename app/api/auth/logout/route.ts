// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  AUTH_COOKIE_NAME,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookies();
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.set(ACCESS_COOKIE_NAME, "", {
      ...ACCESS_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set(REFRESH_COOKIE_NAME, "", {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...ACCESS_COOKIE_OPTIONS,
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
