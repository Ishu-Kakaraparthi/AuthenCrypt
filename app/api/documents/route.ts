
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";
import supabase from "@/app/lib/supabase";

const BUCKET = "authencrypt-documents";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("auth_session")?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    return {
      error: NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      ),
    };
  }

  try {
    const { payload } = await jwtVerify(
      token,
      Buffer.from(secret, "hex")
    );

    const userId = payload.sub;

    if (!userId) {
      return {
        error: NextResponse.json(
          { error: "Invalid session." },
          { status: 401 }
        ),
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return {
        error: NextResponse.json(
          { error: "User not found." },
          { status: 401 }
        ),
      };
    }

    return { user };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      ),
    };
  }
}

// GET: Fetch documents owned by or shared with the logged-in user.
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    if ("error" in auth) return auth.error;

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { ownerId: auth.user.id },
          {
            permissions: {
              some: { userId: auth.user.id },
            },
          },
        ],
      },
      select: {
        id: true,
        originalName: true,
        ownerId: true,
        contentType: true,
        size: true,
        uploadedAt: true,
        permissions: {
          where: { userId: auth.user.id },
          select: { permission: true },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    const result = documents.map((document) => ({
      id: document.id,
      originalName: document.originalName,
      ownerId: document.ownerId,
      contentType: document.contentType,
      size: document.size,
      uploadedAt: document.uploadedAt,
      access:
        document.ownerId === auth.user.id
          ? "OWNER"
          : document.permissions[0]?.permission ?? "READ",
    }));

    return NextResponse.json({ documents: result });
  } catch (error) {
    console.error("Fetch documents error:", error);

    return NextResponse.json(
      { error: "Failed to fetch documents." },
      { status: 500 }
    );
  }
}

// DELETE: Remove an owned document from Supabase and the database.
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    if ("error" in auth) return auth.error;

    const body = await request.json();
    const documentId = body.id;

    if (typeof documentId !== "string" || !documentId.trim()) {
      return NextResponse.json(
        { error: "A valid document ID is required." },
        { status: 400 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId: auth.user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    // Remove the file from the same private Supabase bucket used for uploads.
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([document.storedName]);

    if (storageError) {
      console.error("Supabase delete error:", storageError);

      return NextResponse.json(
        { error: "Could not delete the stored document." },
        { status: 500 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          action: "DOCUMENT_DELETED",
          documentId: document.id,
          fileName: document.originalName,
          actor: auth.user.email,
        },
      });

      await tx.document.delete({
        where: { id: document.id },
      });
    });

    return NextResponse.json({
      message: "Document deleted successfully.",
    });
  } catch (error) {
    console.error("Delete document error:", error);

    return NextResponse.json(
      { error: "Failed to delete document." },
      { status: 500 }
    );
  }
}
