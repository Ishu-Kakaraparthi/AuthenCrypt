-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "documentId" TEXT,
    "fileName" TEXT,
    "actor" TEXT NOT NULL DEFAULT 'local-user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
