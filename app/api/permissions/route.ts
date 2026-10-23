
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/app/lib/prisma";

async function getUser(request: NextRequest) {
  const token = request.cookies.get("auth_session")?.value;
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || !/^[a-f0-9]{64}$/i.test(secret)) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      Buffer.from(secret, "hex"),
      { algorithms: ["HS256"] }
    );

    if (!payload.sub) return null;

    return await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });
  } catch {
    return null;
  }
}

 // GET: List users who have access to a document
export async function GET(request: NextRequest) {
  try {
    const actor = await getUser(request);

    if (!actor) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const documentId = request.nextUrl.searchParams.get("documentId")?.trim();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 }
      );
    }

    // Only the document owner can manage or view its permissions.
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId: actor.id,
      },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    const permissions = await prisma.documentPermission.findMany({
      where: { documentId },
      select: {
        id: true,
        permission: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Permission list failed:", error);

    return NextResponse.json(
      { error: "Failed to load document permissions." },
      { status: 500 }
    );
  }
}


// POST: Grant or revoke access to a document
export async function POST(request: NextRequest) {
  try {
    const actor = await getUser(request);

    if (!actor) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const documentId =
      typeof body.documentId === "string" ? body.documentId.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const action = body.action;
    const permission = body.permission;

    if (!documentId || !email || !["GRANT", "REVOKE"].includes(action)) {
      return NextResponse.json(
        { error: "Valid documentId, email, and action are required." },
        { status: 400 }
      );
    }

    if (
      action === "GRANT" &&
      !["READ", "EDIT"].includes(permission)
    ) {
      return NextResponse.json(
        { error: "Permission must be READ or EDIT." },
        { status: 400 }
      );
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, ownerId: actor.id },
      select: { id: true, originalName: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 }
      );
    }

    const recipient = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient account not found." },
        { status: 404 }
      );
    }

    if (recipient.id === actor.id) {
      return NextResponse.json(
        { error: "You already own this document." },
        { status: 400 }
      );
    }

    if (action === "GRANT") {
      await prisma.$transaction(async (tx) => {
        await tx.documentPermission.upsert({
          where: {
            documentId_userId: {
              documentId,
              userId: recipient.id,
            },
          },
          create: {
            documentId,
            userId: recipient.id,
            permission,
            grantedById: actor.id,
          },
          update: {
            permission,
            grantedById: actor.id,
          },
        });

        await tx.auditLog.create({
          data: {
            action: `PERMISSION_GRANTED_${permission}`,
            documentId,
            fileName: document.originalName,
            actor: actor.email,
          },
        });
      });

      return NextResponse.json({
        message: `${permission} access granted successfully.`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.documentPermission.deleteMany({
        where: { documentId, userId: recipient.id },
      });

      await tx.auditLog.create({
        data: {
          action: "PERMISSION_REVOKED",
          documentId,
          fileName: document.originalName,
          actor: actor.email,
        },
      });
    });

    return NextResponse.json({
      message: "Document access revoked successfully.",
    });
  } catch (error) {
    console.error("Permission update failed:", error);

    return NextResponse.json(
      { error: "Failed to update document permissions." },
      { status: 500 }
    );
  }
}
