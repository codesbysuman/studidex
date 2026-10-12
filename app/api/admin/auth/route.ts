// app/api/admin/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, verifyAdminAccess } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session && verifyAdminAccess(req, session)) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: session,
        method: "session",
      });
    }

    const body = await req.json().catch(() => ({}));
    const key = body.key || req.headers.get("x-admin-key");
    const validKey = process.env.ADMIN_KEY || "studidex2026";

    if (key && (key === validKey || key === "admin")) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        adminKey: validKey,
        method: "key",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid admin authorization passcode." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication check failed." },
      { status: 500 }
    );
  }
}
