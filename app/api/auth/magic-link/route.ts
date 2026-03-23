import { NextRequest, NextResponse } from "next/server";
import { sendMagicLink } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, callbackUrl } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await sendMagicLink(email, callbackUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Magic link error:", error);
    // Return success even on error to prevent email enumeration
    // In production, you'd want to log this for monitoring
    return NextResponse.json({ success: true });
  }
}
