
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";
import path from "path";
import { readFile } from "fs/promises";
export async function GET(request: NextRequest) {
  let actorEmail = "unauthenticated";
  let documentId: string | null = null;

  try {
    const token = request.cookies.get("auth_session")?.value;
    const secret = process.env.SESSION_SECRET;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
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
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 401 }
      );
    }

    actorEmail = user.email;
    documentId = request.nextUrl.searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        permissions: {
          where: { userId: user.id },
          select: { permission: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    const isOwner = document.ownerId === user.id;
    const hasSharedAccess = document.permissions.length > 0;

    if (!isOwner && !hasSharedAccess) {
      await prisma.auditLog.create({
        data: {
          action: "DOCUMENT_ACCESS_DENIED",
          documentId: document.id,
          fileName: document.originalName,
          actor: actorEmail,
        },
      });

      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    const uploadDirectory = path.resolve(process.cwd(), "private_uploads");
    const filePath = path.resolve(uploadDirectory, document.storedName);

    if (
      path.dirname(filePath) !== uploadDirectory ||
      path.basename(document.storedName) !== document.storedName
    ) {
      return NextResponse.json(
        { error: "Invalid stored file path." },
        { status: 400 }
      );
    }

    const fileBuffer = await readFile(filePath);

    await prisma.auditLog.create({
      data: {
        action: "DOCUMENT_DOWNLOADED",
        documentId: document.id,
        fileName: document.originalName,
        actor: user.email,
      },
    });

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": document.contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          document.originalName
        )}"`,
        "Content-Length": String(fileBuffer.length),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Download document error:", error);

    return NextResponse.json(
      { error: "Failed to download document." },
      { status: 500 }
    );
  }
}
