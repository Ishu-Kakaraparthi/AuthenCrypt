
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const secretValue = process.env.SESSION_SECRET;

    if (!secretValue || !/^[a-fA-F0-9]{64}$/.test(secretValue)) {
      return NextResponse.json(
        { error: "Server authentication configuration error." },
        { status: 500 }
      );
    }

    const secret = new Uint8Array(Buffer.from(secretValue, "hex"));

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string") {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 401 }
      );
    }

    // Only administrators can view the complete audit trail.
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        action: true,
        documentId: true,
        fileName: true,
        actor: true,
        createdAt: true,
      },
    });

    // Resolve older audit records that stored the actor's user ID.
    const actorIds = [...new Set(logs.map((log) => log.actor))];

    const actorUsers = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: {
        id: true,
        email: true,
      },
    });

    const emailByUserId = new Map(
      actorUsers.map((actorUser) => [actorUser.id, actorUser.email])
    );

    const formattedLogs = logs.map((log) => ({
      ...log,
      actor: emailByUserId.get(log.actor) ?? log.actor,
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    if (
      error instanceof Error &&
      (
        error.name === "JWTExpired" ||
        error.name === "JWTInvalid" ||
        error.name === "JWSInvalid" ||
        error.name === "JWSSignatureVerificationFailed"
      )
    ) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please log in again." },
        { status: 401 }
      );
    }

    console.error("Audit API error:", error);

    return NextResponse.json(
      { error: "Could not retrieve audit records." },
      { status: 500 }
    );
  }
}
