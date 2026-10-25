
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import prisma from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    const loginType =
      body.loginType === "ADMIN" ? "ADMIN" : "USER";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
    if (!user.emailVerified) {
  return NextResponse.json(
    {
      error:
        "Please verify your email before logging in. Check your inbox for the verification link.",
    },
    { status: 403 }
  );
}

    // Verify the selected login type against the database role.
    if (user.role !== loginType) {
      return NextResponse.json(
        { error: "Please select the correct login type." },
        { status: 403 }
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

    const token = await new SignJWT({
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(Buffer.from(secret, "hex"));

    const response = NextResponse.json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { error: "Login could not be completed." },
      { status: 500 }
    );
  }
}
