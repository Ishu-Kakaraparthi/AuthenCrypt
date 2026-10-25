
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import prisma from "@/app/lib/prisma";


export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 254) {
      return NextResponse.json(
        { error: "Name or email is too long." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 12 characters and no more than 72 UTF-8 bytes.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser?.emailVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            passwordHash,
            emailVerified: false,
            verificationTokenHash: tokenHash,
            verificationTokenExpiresAt: expiresAt,
          },
          select: { id: true, email: true },
        })
      : await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            emailVerified: false,
            verificationTokenHash: tokenHash,
            verificationTokenExpiresAt: expiresAt,
          },
          select: { id: true, email: true },
        });

    const baseUrl =
      process.env.APP_URL || new URL(request.url).origin;

    const verificationUrl = new URL(
      "/api/verify-email",
      baseUrl
    );
    verificationUrl.searchParams.set("token", token);

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Email service is not configured. Please contact the administrator.",
        },
        { status: 500 }
      );
    }

    const emailResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AuthenCrypt <onboarding@resend.dev>",
          to: [user.email],
          subject: "Verify your AuthenCrypt email",
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>Verify your email</h2>
              <p>Click the button below to verify your AuthenCrypt account.</p>
              <p>
                <a href="${verificationUrl.toString()}"
                   style="display:inline-block;padding:12px 18px;background:#315c49;color:#fff;text-decoration:none;border-radius:6px">
                  Verify email
                </a>
              </p>
              <p>This link expires in 24 hours.</p>
              <p>If you did not request this account, you can ignore this email.</p>
            </div>
          `,
        }),
      }
    );

    if (!emailResponse.ok) {
      const details = await emailResponse.text();
      console.error("Resend email failed:", details);

      return NextResponse.json(
        {
          error:
            "Verification email could not be sent. Check the email service configuration and try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message:
          "Registration received. Check your email and click the verification link before logging in.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration failed:", error);

    return NextResponse.json(
      { error: "Registration could not be completed." },
      { status: 500 }
    );
  }
}
