
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";
import supabase from "@/app/lib/supabase";


const BUCKET = "authencrypt-documents";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify the login session.
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

    let userId: string;

    try {
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

      userId = payload.sub;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    // 2. Confirm that the user still exists.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 401 }
      );
    }

    // 3. Find the requested document and the user's permission.
    const documentId = request.nextUrl.searchParams.get("id");

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
    const hasReadPermission = document.permissions.some(
      (permission) => permission.permission === "READ"
    );
    const hasWritePermission = document.permissions.some(
      (permission) => permission.permission === "WRITE"
    );

    if (!isOwner && !hasReadPermission && !hasWritePermission) {
      await prisma.auditLog.create({
        data: {
          action: "DOCUMENT_ACCESS_DENIED",
          documentId: document.id,
          fileName: document.originalName,
          actor: user.email,
        },
      });

      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    // 4. Download the file from the private Supabase bucket.
    const { data: fileBlob, error: downloadError } =
      await supabase.storage
        .from(BUCKET)
        .download(document.storedName);

    if (downloadError || !fileBlob) {
      console.error(
        "Supabase storage download failed:",
        downloadError?.message
      );

      return NextResponse.json(
        { error: "Stored document could not be retrieved." },
        { status: 502 }
      );
    }

    const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());

    // 5. Record the successful download.
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
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          document.originalName
        )}`,
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
