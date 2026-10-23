
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
]);

const EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "text/plain": ".txt",
};

export async function POST(request: NextRequest) {
  let savedPath: string | null = null;
  let documentId: string | null = null;

  try {
    // 1. Verify the login session.
    const token = request.cookies.get("auth_session")?.value;
    const secret = process.env.SESSION_SECRET;

    if (!token) {
      return NextResponse.json(
        { error: "Please log in to upload documents." },
        { status: 401 }
      );
    }

    if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
      console.error("SESSION_SECRET is missing or invalid.");

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
      select: { id: true ,email: true},
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 401 }
      );
    }

    // 3. Validate the uploaded file.
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a file to upload." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Empty files are not allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must not exceed 5 MB." },
        { status: 413 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Only PDF, PNG, JPEG, and plain text files are allowed.",
        },
        { status: 415 }
      );
    }

    // 4. Save the file under a random server-generated name.
    const bytes = Buffer.from(await file.arrayBuffer());
    const storedName = `${randomUUID()}${EXTENSIONS[file.type]}`;
    const uploadDir = path.join(process.cwd(), "private_uploads");

    await mkdir(uploadDir, { recursive: true });

    savedPath = path.join(uploadDir, storedName);

    await writeFile(savedPath, bytes, {
      flag: "wx",
      mode: 0o600,
    });

    // 5. Associate the document with the logged-in user.
    const document = await prisma.document.create({
      data: {
        originalName: file.name,
        ownerId: user.id,
        storedName,
        contentType: file.type,
        size: file.size,
      },
    });

    documentId = document.id;

    // 6. Record who uploaded the document.
    await prisma.auditLog.create({
      data: {
        action: "DOCUMENT_UPLOADED",
        documentId: document.id,
        fileName: document.originalName,
        actor: user.email,
      },
    });

    return NextResponse.json(
      {
        message: "File saved and audit record created successfully.",
        document: {
          id: document.id,
          originalName: document.originalName,
          contentType: document.contentType,
          size: document.size,
          uploadedAt: document.uploadedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload failed:", error);

    if (savedPath) {
      try {
        await unlink(savedPath);
      } catch (cleanupError) {
        console.error("File cleanup failed:", cleanupError);
      }
    }

    if (documentId) {
      try {
        await prisma.document.delete({
          where: { id: documentId },
        });
      } catch (cleanupError) {
        console.error("Document cleanup failed:", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Could not save the file and its audit record." },
      { status: 500 }
    );
  }
}
