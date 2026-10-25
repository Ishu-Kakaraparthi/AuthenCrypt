
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import prisma from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token || token.length > 256) {
      return NextResponse.json(
        { error: "Invalid verification link." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await prisma.user.findUnique({
      where: { verificationTokenHash: tokenHash },
      select: {
        id: true,
        emailVerified: true,
        verificationTokenExpiresAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or already used verification link." },
        { status: 400 }
      );
    }

    if (
      !user.verificationTokenExpiresAt ||
      user.verificationTokenExpiresAt.getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "Verification link expired. Please register again or request a new link." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
      },
    });

    return NextResponse.redirect(
      new URL("/login?verified=1", request.url)
    );
  } catch (error) {
    console.error("Email verification failed:", error);

    return NextResponse.json(
      { error: "Email verification could not be completed." },
      { status: 500 }
    );
  }
}
