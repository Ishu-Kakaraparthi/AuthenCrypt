
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

    const secret = process.env.SESSION_SECRET;

    if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
      console.error("SESSION_SECRET is missing or invalid.");

      return NextResponse.json(
        { error: "Server session configuration error." },
        { status: 500 }
      );
    }

    const { payload } = await jwtVerify(
      token,
      Buffer.from(secret, "hex"),
      { algorithms: ["HS256"] }
    );

    if (!payload.sub) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
},
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired session." },
      { status: 401 }
    );
  }
}
