"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import UploadForm from "./components/UploadForm";

type DocumentRecord = {
  id: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  access: "OWNER" | "READ" | "EDIT";
};

type AuditRecord = {
  id: string;
  action: string;
  documentId: string | null;
  fileName: string | null;
  actor: string;
  createdAt: string;
};

type UserRecord = {
  id?: string;
  name?: string;
  email?: string;
  createdAt?: string;
};

type ThemeSettings = {
  sidebar: string;
  content: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryHover: string;
  accent: string;
  input: string;
  hover: string;
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: "⌂" },
  { label: "Documents", icon: "▤" },
  { label: "Access Control", icon: "♙" },
  { label: "Audit Trail", icon: "◷" },
  { label: "Settings", icon: "⚙" },
];


const DEFAULT_THEME: ThemeSettings = {
  sidebar: "#d9eee7", content: "#f4f8f6", surface: "#ffffff",
  text: "#1e293b", muted: "#64748b", border: "#e2e8f0",
  primary: "#315c49", primaryHover: "#264a39", accent: "#e5f0e3",
  input: "#ffffff", hover: "#f1f5f9",
};

const THEME_PRESETS: { name: string; theme: ThemeSettings }[] = [
  { name: "Mint & Cloud", theme: DEFAULT_THEME },
  { name: "Sage & Cream", theme: { sidebar: "#e4efe3", content: "#f8f6f0", surface: "#ffffff", text: "#29372d", muted: "#667568", border: "#dce5d9", primary: "#42634a", primaryHover: "#314b38", accent: "#e1eddf", input: "#ffffff", hover: "#edf4ea" } },
  { name: "Blue & Mist", theme: { sidebar: "#dce9f5", content: "#f4f7fb", surface: "#ffffff", text: "#1e293b", muted: "#64748b", border: "#dbe4ef", primary: "#285b91", primaryHover: "#1e456f", accent: "#dceafb", input: "#ffffff", hover: "#edf4fc" } },
  { name: "Lavender & Ivory", theme: { sidebar: "#eae2f4", content: "#faf7fc", surface: "#ffffff", text: "#30253d", muted: "#71627f", border: "#e4d9ef", primary: "#6b4790", primaryHover: "#50336d", accent: "#eee5fa", input: "#ffffff", hover: "#f5effb" } },
  { name: "Sand & White", theme: { sidebar: "#eee4d5", content: "#fbfaf7", surface: "#ffffff", text: "#3c3328", muted: "#786d5e", border: "#e7ddcf", primary: "#805b32", primaryHover: "#624324", accent: "#f3e6d2", input: "#ffffff", hover: "#f8f0e5" } },
  { name: "Dark Graphite", theme: { sidebar: "#151a23", content: "#0d1117", surface: "#1c2430", text: "#f1f5f9", muted: "#aab6c5", border: "#374151", primary: "#78a9ff", primaryHover: "#a2c2ff", accent: "#26364b", input: "#111823", hover: "#293444" } },
  { name: "Dark Forest", theme: { sidebar: "#10231d", content: "#0b1713", surface: "#152720", text: "#ecfdf5", muted: "#a7c4b6", border: "#304a3d", primary: "#65d6a3", primaryHover: "#91e7bd", accent: "#203d30", input: "#102019", hover: "#254333" } },
];


export default function Home() {
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement>(null);

  const [active, setActive] = useState("Dashboard");
  const [user, setUser] = useState<UserRecord | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("All");
  const [auditFilter, setAuditFilter] = useState("All");
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [avatar, setAvatar] = useState("");
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const themeStyles = {
    "--app-sidebar": theme.sidebar,
    "--app-content": theme.content,
    "--app-surface": theme.surface,
    "--app-text": theme.text,
    "--app-muted": theme.muted,
    "--app-border": theme.border,
    "--app-primary": theme.primary,
    "--app-primary-hover": theme.primaryHover,
    "--app-accent": theme.accent,
    "--app-input": theme.input,
    "--app-hover": theme.hover,
  } as CSSProperties;
  const [sharingDocument, setSharingDocument] =
  useState<DocumentRecord | null>(null);

const [sharedUsers, setSharedUsers] = useState<
  {
    id: string;
    permission: "READ" | "EDIT";
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[]
>([]);

const [shareEmail, setShareEmail] = useState("");
const [sharePermission, setSharePermission] =
  useState<"READ">("READ");

const [shareLoading, setShareLoading] = useState(false);
const [shareMessage, setShareMessage] = useState("");

  // Restore saved visual preferences.
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("authencrypt-theme");
      const savedAvatar = localStorage.getItem("authencrypt-avatar");

      if (savedTheme) {
        const parsed = JSON.parse(savedTheme) as Partial<ThemeSettings>;
        if (parsed.sidebar && parsed.content) setTheme({ ...DEFAULT_THEME, ...parsed });
      }

      if (savedAvatar) setAvatar(savedAvatar);
    } catch {
      // Keep default appearance if saved preferences are invalid.
    }
  }, []);

  // Check the existing login session.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) router.replace("/login");
          return;
        }

        const data = await response.json();
        const sessionUser = data.user ?? data;

        if (!cancelled) {
          setUser({
            id: sessionUser.id,
            name: sessionUser.name,
            email: sessionUser.email,
            createdAt: sessionUser.createdAt,
          });
          setAuthenticated(true);
        }
      } catch {
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);

    try {
      const response = await fetch("/api/documents", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) router.replace("/login");
        throw new Error("Could not load documents.");
      }

      const data = await response.json();
      const records = Array.isArray(data)
        ? data
        : data.documents ?? data.records ?? [];

      setDocuments(records);
    } catch {
      setPageMessage("Documents could not be refreshed. Please try again.");
    } finally {
      setLoadingDocuments(false);
    }
  }, [router]);

  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true);

    try {
      const response = await fetch("/api/audit", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          throw new Error("Your session has expired. Please sign in again.");
        }
        if (response.status === 403) {
          setAuditLogs([]);
          throw new Error("You do not have permission to view this audit history.");
        }
        throw new Error("Could not load audit records.");
      }

      const data = await response.json();
      const records = Array.isArray(data)
        ? data
        : data.logs ?? data.auditLogs ?? data.records ?? [];

      setAuditLogs(records);
    } catch (error) {
      setPageMessage(
        error instanceof Error
          ? error.message
          : "Audit history could not be loaded."
      );
    } finally {
      setLoadingAudit(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authenticated) return;

    void loadDocuments();
    void loadAuditLogs();
  }, [authenticated, loadDocuments, loadAuditLogs]);

  const openShareDialog = async (doc: DocumentRecord) => {
  setSharingDocument(doc);
  setSharedUsers([]);
  setShareEmail("");
  setSharePermission("READ");
  setShareMessage("");
  setShareLoading(true);

  try {
    const response = await fetch(
      `/api/permissions?documentId=${encodeURIComponent(doc.id)}`,
      { credentials: "same-origin" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load permissions.");
    }

    setSharedUsers(data.permissions || []);
  } catch (error) {
    setShareMessage(
      error instanceof Error
        ? error.message
        : "Could not load permissions."
    );
  } finally {
    setShareLoading(false);
  }
};
const updatePermission = async (
  email: string,
  action: "GRANT" | "REVOKE",
  permission: "READ" = "READ"
) => {
  if (!sharingDocument) return;

  setShareLoading(true);
  setShareMessage("");

  try {
    const response = await fetch("/api/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        documentId: sharingDocument.id,
        email,
        action,
        permission,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Permission update failed.");
    }

    setShareMessage(data.message || "Permissions updated.");

    const refreshed = await fetch(
      `/api/permissions?documentId=${encodeURIComponent(sharingDocument.id)}`,
      { credentials: "same-origin" }
    );
    const refreshedData = await refreshed.json();

    if (!refreshed.ok) {
      throw new Error(
        refreshedData.error || "Permission updated, but list refresh failed."
      );
    }

    setSharedUsers(refreshedData.permissions || []);
    setShareEmail("");
  } catch (error) {
    setShareMessage(
      error instanceof Error
        ? error.message
        : "Permission update failed."
    );
  } finally {
    setShareLoading(false);
  }
};
  // Filter document records.
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = doc.originalName.toLowerCase().includes(query);
      const type = `${doc.contentType} ${doc.originalName}`.toLowerCase();

      const matchesType =
        fileType === "All" ||
        (fileType === "PDF" &&
          (type.includes("pdf") || type.endsWith(".pdf"))) ||
        (fileType === "TXT" &&
          (type.includes("text/plain") || type.endsWith(".txt"))) ||
        (fileType === "Images" &&
          (type.includes("image/") ||
            /\.(png|jpe?g|gif|webp|bmp)$/i.test(doc.originalName)));

      return matchesSearch && matchesType;
    });
  }, [documents, search, fileType]);

  const filteredAuditLogs = useMemo(() => {
    if (auditFilter === "All") return auditLogs;

    return auditLogs.filter((log) =>
      (log.action ?? "").toLowerCase().includes(auditFilter.toLowerCase())
    );
  }, [auditLogs, auditFilter]);

  const formatSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
  };

  const getFileKind = (doc: DocumentRecord) => {
    const type = `${doc.contentType} ${doc.originalName}`.toLowerCase();

    if (type.includes("pdf") || type.endsWith(".pdf")) return "PDF";

    if (
      type.includes("image/") ||
      /\.(png|jpe?g|gif|webp|bmp)$/i.test(doc.originalName)
    ) {
      return "Image";
    }

    if (type.includes("text/plain") || type.endsWith(".txt")) return "Text";

    return "File";
  };

  const exportToExcel = () => {
    const rows = filteredDocuments.map((doc) => ({
      "File name": doc.originalName,
      "File type": getFileKind(doc),
      "Content type": doc.contentType,
      Size: formatSize(doc.size),
      "Uploaded at": formatDate(doc.uploadedAt),
      "Document ID": doc.id,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 32 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
      { wch: 24 },
      { wch: 34 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");
    XLSX.writeFile(workbook, "AuthenCrypt-Documents.xlsx");
  };

  // Delete document only after user confirmation.
  const deleteDocument = async (doc: DocumentRecord) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${doc.originalName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(doc.id);
    setPageMessage("");

    try {
      const response = await fetch("/api/documents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: doc.id }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPageMessage(result.error || "Could not delete the document.");
        return;
      }

      setPageMessage(result.message || "Document deleted successfully.");

      // Refresh the document list and audit trail after deletion.
      await Promise.all([loadDocuments(), loadAuditLogs()]);
    } catch (error) {
      console.error("Document deletion failed:", error);
      setPageMessage("Could not connect to the server. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const saveTheme = (nextTheme: ThemeSettings) => {
    setTheme(nextTheme);

    try {
      localStorage.setItem("authencrypt-theme", JSON.stringify(nextTheme));
    } catch {
      setPageMessage("Could not save theme preferences in this browser.");
    }
  };

  const chooseAvatar = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPageMessage("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPageMessage("Please choose an image smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") return;

      try {
        localStorage.setItem("authencrypt-avatar", reader.result);
        setAvatar(reader.result);
        setPageMessage("Profile photo updated successfully.");
      } catch {
        setPageMessage(
          "The image could not be saved in browser storage. Try a smaller image."
        );
      }
    };

    reader.onerror = () => {
      setPageMessage("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    try {
      localStorage.removeItem("authencrypt-avatar");
      setAvatar("");
      setPageMessage("Profile photo removed.");
    } catch {
      setPageMessage("Could not remove the saved profile photo.");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/logout", { method: "POST" });

      if (!response.ok) {
        setPageMessage("Logout failed. Please try again.");
        setLoggingOut(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setPageMessage("Could not connect to the server to log out.");
      setLoggingOut(false);
    }
  };

  const navigate = (label: string) => {
    setActive(label);
    setPageMessage("");
  };

  if (checkingSession || !authenticated) {
    return (
      <main style={themeStyles} className="flex min-h-screen items-center justify-center bg-[var(--app-content)] text-[var(--app-text)]">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-5 shadow-sm">
          <p className="text-sm font-medium">
            Checking your secure session…
          </p>
        </div>
      </main>
    );
  }

  const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
  const currentUserName = user?.name?.trim() || "Account";
  const currentUserEmail = user?.email || "Signed-in user";

  const cardClass =
    "rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 text-[var(--app-text)] shadow-sm transition hover:shadow-md";

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-hover)] disabled:cursor-not-allowed disabled:opacity-50";

  const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main style={themeStyles} className="flex h-screen overflow-hidden bg-[var(--app-content)] text-[var(--app-text)]">
      {/* Sidebar */}
      <aside
        className="flex h-screen w-[250px] shrink-0 flex-col border-r border-black/5"
        style={{ backgroundColor: "var(--app-sidebar)", color: "var(--app-text)" }}
      >
        <div className="border-b border-black/5 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-xl font-bold text-white shadow-sm">
              A
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-[var(--app-primary)]">
                AuthenCrypt
              </h1>
              <p className="text-xs text-[var(--app-muted)]">Secure workspace</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-6">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
            Workspace
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV_ITEMS.map((item) => {
            const selected = active === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  selected
                    ? "bg-[var(--app-primary)] text-white shadow-sm"
                    : "text-[var(--app-text)] hover:bg-[var(--app-surface)]/70"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center text-lg">
                  {item.icon}
                </span>

                {item.label}

                {item.label === "Documents" && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                      selected
                        ? "bg-[var(--app-surface)]/20 text-white"
                        : "bg-[var(--app-surface)] text-[var(--app-muted)]"
                    }`}
                  >
                    {documents.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Clicking anywhere on the profile widget opens Settings. */}
        <div className="border-t border-black/5 p-4">
          <button
            type="button"
            onClick={() => navigate("Settings")}
            aria-label="Open profile settings"
            className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-[var(--app-surface)]/70 p-3 text-left transition hover:bg-[var(--app-surface)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[var(--app-accent)] text-xl shadow-sm">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden="true">👤</span>
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-[var(--app-text)]">
                {currentUserName}
              </span>
              <span className="block truncate text-xs text-[var(--app-muted)]">
                {currentUserEmail}
              </span>
            </span>
          </button>

          {/* Keep the hidden input available for Settings photo controls. */}
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              chooseAvatar(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          <p className="mt-3 text-center text-[10px] text-[var(--app-muted)]">
            Session-protected workspace · AuthenCrypt
          </p>
        </div>
      </aside>

      {/* Main content */}
      <section
        className="h-screen min-w-0 flex-1 overflow-y-auto"
        style={{ backgroundColor: "var(--app-content)", color: "var(--app-text)" }}
      >
        <div className="mx-auto w-full max-w-[1500px] p-5 md:p-8 xl:p-10">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--app-muted)]">
                Workspace <span className="mx-1">/</span> {active}
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[var(--app-primary)]">
                {active}
              </h2>

              <p className="mt-2 text-sm text-[var(--app-muted)]">
                {active === "Dashboard" &&
                  "Your secure documents and workspace activity at a glance."}
                {active === "Documents" &&
                  "Upload, find, review, and export your document records."}
                {active === "Access Control" &&
                  "Understand how authenticated access and document ownership are protected."}
                {active === "Audit Trail" &&
                  "Review recorded activity to support accountability."}
                {active === "Settings" &&
                  "Personalize your workspace and account display."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={primaryButtonClass}
            >
              {loggingOut ? "Logging out…" : "↪ Logout"}
            </button>
          </header>

          {pageMessage && (
            <div
              role="status"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <span>{pageMessage}</span>
              <button
                type="button"
                onClick={() => setPageMessage("")}
                className="font-semibold underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Dashboard */}
          {active === "Dashboard" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => navigate("Documents")}
                  className={`${cardClass} text-left`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--app-muted)]">
                        Total documents
                      </p>
                      <p className="mt-3 text-3xl font-bold text-[var(--app-primary)]">
                        {documents.length}
                      </p>
                    </div>
                    <span className="rounded-xl bg-[var(--app-accent)] p-3 text-xl">
                      ▤
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-[var(--app-primary)]">
                    View document library →
                  </p>
                </button>

                <div className={cardClass}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--app-muted)]">
                        Stored file size
                      </p>
                      <p className="mt-3 text-3xl font-bold text-[var(--app-primary)]">
                        {formatSize(totalSize)}
                      </p>
                    </div>
                    <span className="rounded-xl bg-[var(--app-accent)] p-3 text-xl">
                      ▧
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-[var(--app-muted)]">
                    Combined size of listed documents
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("Access Control")}
                  className={`${cardClass} text-left`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--app-muted)]">
                        Access control
                      </p>
                      <p className="mt-3 text-2xl font-bold text-[var(--app-primary)]">
                        Session & permissions
                      </p>
                    </div>
                    <span className="rounded-xl bg-[var(--app-accent)] p-3 text-xl">
                      ♙
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-[var(--app-primary)]">
                    Review protection details →
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("Audit Trail")}
                  className={`${cardClass} text-left`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--app-muted)]">
                        Audit events
                      </p>
                      <p className="mt-3 text-3xl font-bold text-[var(--app-primary)]">
                        {auditLogs.length}
                      </p>
                    </div>
                    <span className="rounded-xl bg-[var(--app-accent)] p-3 text-xl">
                      ◷
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-[var(--app-primary)]">
                    Inspect recorded events →
                  </p>
                </button>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className={`${cardClass} xl:col-span-2`}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--app-primary)]">
                        Recent documents
                      </h3>
                      <p className="mt-1 text-sm text-[var(--app-muted)]">
                        The latest document records available to your account.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("Documents")}
                      className={buttonClass}
                    >
                      View all
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--app-border)] px-4 py-10 text-center">
                      <p className="font-semibold text-[var(--app-text)]">
                        No documents to display
                      </p>
                      <p className="mt-1 text-sm text-[var(--app-muted)]">
                        Open Documents to upload your first file.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[var(--app-border)] text-xs uppercase tracking-wide text-[var(--app-muted)]">
                            <th className="pb-3 pr-4 font-semibold">
                              Document
                            </th>
                            <th className="pb-3 pr-4 font-semibold">Type</th>
                            <th className="pb-3 font-semibold">Uploaded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...documents]
                            .sort(
                              (a, b) =>
                                new Date(b.uploadedAt).getTime() -
                                new Date(a.uploadedAt).getTime()
                            )
                            .slice(0, 5)
                            .map((doc) => (
                              <tr
                                key={doc.id}
                                className="border-b border-[var(--app-border)] last:border-0"
                              >
                                <td className="max-w-[230px] py-4 pr-4">
                                  <p className="truncate font-semibold text-[var(--app-text)]">
                                    {doc.originalName}
                                  </p>
                                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                                    {formatSize(doc.size)}
                                  </p>
                                </td>
                                <td className="py-4 pr-4">
                                  <span className="rounded-lg bg-[var(--app-accent)] px-2 py-1 text-xs font-semibold text-[var(--app-primary)]">
                                    {getFileKind(doc)}
                                  </span>
                                </td>
                                <td className="py-4 text-xs text-[var(--app-muted)]">
                                  {formatDate(doc.uploadedAt)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className={cardClass}>
                  <h3 className="text-lg font-bold text-[var(--app-primary)]">
                    Security overview
                  </h3>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Current workspace checks
                  </p>

                  <div className="mt-5 space-y-4">
                    {[
                      ["Session status", "Dashboard checks your signed-in session"],
                      ["Document records", "Records returned by the documents API"],
                      ["Activity history", "Recorded events returned by the audit API"],
                    ].map(([title, description]) => (
                      <div key={title} className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] text-sm text-[var(--app-primary)]">
                          ✓
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--app-text)]">
                            {title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                            {description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("Access Control")}
                    className={`${buttonClass} mt-6 w-full`}
                  >
                    View access controls
                  </button>
                </div>
              </div>

              <div className={cardClass}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--app-primary)]">
                      Recent audit activity
                    </h3>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                      Activity recorded by the server and returned by the audit API.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("Audit Trail")}
                    className={buttonClass}
                  >
                    Open audit trail
                  </button>
                </div>

                {auditLogs.length === 0 ? (
                  <p className="rounded-xl bg-[var(--app-hover)] p-4 text-sm text-[var(--app-muted)]">
                    {loadingAudit
                      ? "Loading activity…"
                      : "No audit events are available to display."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...auditLogs]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .slice(0, 4)
                      .map((log) => (
                        <div
                          key={log.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--app-hover)] px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[var(--app-text)]">
                              {log.action}
                            </p>
                            <p className="mt-1 text-xs text-[var(--app-muted)]">
                              {log.fileName || "Workspace event"} · {log.actor}
                            </p>
                          </div>
                          <p className="text-xs text-[var(--app-muted)]">
                            {formatDate(log.createdAt)}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Documents */}
          {active === "Documents" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className={cardClass}>
                  <p className="text-sm text-[var(--app-muted)]">Documents listed</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--app-primary)]">
                    {documents.length}
                  </p>
                </div>
                <div className={cardClass}>
                  <p className="text-sm text-[var(--app-muted)]">
                    Matching current filter
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--app-primary)]">
                    {filteredDocuments.length}
                  </p>
                </div>
                <div className={cardClass}>
                  <p className="text-sm text-[var(--app-muted)]">
                    Total listed file size
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--app-primary)]">
                    {formatSize(totalSize)}
                  </p>
                </div>
              </div>

              <div className={`${cardClass} mb-6`}>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[var(--app-primary)]">
                    Upload a document
                  </h3>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Upload PDF, PNG, JPEG, or text files up to 5 MB. The server must validate each upload.
                  </p>
                </div>

                <UploadForm
                  onUploadSuccess={() => {
                    void loadDocuments();
                    void loadAuditLogs();
                  }}
                />
              </div>

              <div className={cardClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--app-primary)]">
                      Document library
                    </h3>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                      Search and filter the document records available to your account.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void loadDocuments()}
                      disabled={loadingDocuments}
                      className={buttonClass}
                      aria-label="Refresh document list"
                    >
                      <span aria-hidden="true">↻</span>
                      {loadingDocuments ? "Refreshing…" : "Refresh"}
                    </button>

                    <button
                      type="button"
                      onClick={exportToExcel}
                      disabled={filteredDocuments.length === 0}
                      className={primaryButtonClass}
                    >
                      ⇩ Export metadata
                    </button>
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-[var(--app-muted)]">
                      Search documents
                    </span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by file name…"
                      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-[var(--app-muted)]">
                      File type
                    </span>
                    <select
                      value={fileType}
                      onChange={(event) => setFileType(event.target.value)}
                      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 text-sm outline-none focus:border-[var(--app-primary)]"
                    >
                      <option>All</option>
                      <option>PDF</option>
                      <option>TXT</option>
                      <option>Images</option>
                    </select>
                  </label>
                </div>

                {filteredDocuments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--app-border)] px-4 py-12 text-center">
                    <p className="font-semibold text-[var(--app-text)]">
                      No matching documents
                    </p>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                      Try a different search or file-type filter.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[var(--app-border)] text-xs uppercase tracking-wide text-[var(--app-muted)]">
                          <th className="pb-3 pr-4 font-semibold">Document</th>
                          <th className="pb-3 pr-4 font-semibold">Type</th>
                          <th className="pb-3 pr-4 font-semibold">Size</th>
                          <th className="pb-3 pr-4 font-semibold">Uploaded</th>
                          <th className="pb-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => {
                          const fileUrl = `/api/download?id=${encodeURIComponent(doc.id)}`;

                          return (
                            <tr
                              key={doc.id}
                              className="border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-hover)]"
                            >
                              <td className="max-w-[260px] py-4 pr-4">
                                <p className="truncate font-semibold text-[var(--app-text)]">
                                  {doc.originalName}
                                </p>
                                <p className="mt-1 truncate text-xs text-[var(--app-muted)]">
                                  {doc.id}
                                </p>
                              </td>

                              <td className="py-4 pr-4">
                                <span className="rounded-lg bg-[var(--app-accent)] px-2 py-1 text-xs font-semibold text-[var(--app-primary)]">
                                  {getFileKind(doc)}
                                </span>
                              </td>

                              <td className="py-4 pr-4 text-[var(--app-muted)]">
                                {formatSize(doc.size)}
                              </td>

                              <td className="py-4 pr-4 text-xs text-[var(--app-muted)]">
                                {formatDate(doc.uploadedAt)}
                              </td>

                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={fileUrl}
                                    className="rounded-lg bg-[var(--app-primary)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                                  >
                                    Download
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => void deleteDocument(doc)}
                                    disabled={deletingId !== null}
                                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {deletingId === doc.id
                                      ? "Deleting…"
                                      : "Delete"}
                                  </button>
                                  {doc.access === "OWNER" && (
  <button
    type="button"
    onClick={() => openShareDialog(doc)}
    className="rounded-md border border-blue-500 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
  >
    Share
  </button>
)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Access Control */}
          {active === "Access Control" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className={cardClass}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-2xl text-[var(--app-primary)]">
                    ♙
                  </div>
                  <h3 className="text-lg font-bold text-[var(--app-primary)]">
                    Authenticated access
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                    The dashboard checks the existing session endpoint. Protected
                    document operations must also validate the session on the server.
                  </p>
                  <span className="mt-4 inline-flex rounded-full bg-[var(--app-accent)] px-3 py-1 text-xs font-semibold text-[var(--app-primary)]">
                    Dashboard session check
                  </span>
                </div>

                <div className={cardClass}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-2xl text-[var(--app-primary)]">
                    ▣
                  </div>
                  <h3 className="text-lg font-bold text-[var(--app-primary)]">
                    Document ownership
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                    Each document request should verify that the signed-in user is
                    authorized to access that specific document. Hiding a button in
                    the interface is not an access-control check.
                  </p>
                  <span className="mt-4 inline-flex rounded-full bg-[var(--app-accent)] px-3 py-1 text-xs font-semibold text-[var(--app-primary)]">
                    Server-side verification required
                  </span>
                </div>
              </div>

              <div className={`${cardClass} mb-6`}>
                <h3 className="text-lg font-bold text-[var(--app-primary)]">
                  Access-control verification checklist
                </h3>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Test each item against the server-side API before marking it as verified.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    [
                      "Session validation",
                      "Test that requests without a valid session are rejected.",
                    ],
                    [
                      "Document-level authorization",
                      "Test that a user cannot read or download another user's private document.",
                    ],
                    [
                      "Upload validation",
                      "Test that the server validates permitted file types and file size.",
                    ],
                    [
                      "Audit coverage",
                      "Verify that sensitive operations record the actor, action, and time.",
                    ],
                  ].map(([title, description]) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-xl border border-[var(--app-border)] p-4"
                    >
                      <span className="mt-0.5 text-lg text-[var(--app-primary)]">✓</span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--app-text)]">
                          {title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  These are security review criteria, not an automated security
                  certification. Verify the actual API implementation and test
                  cross-user access before treating a check as passed.
                </p>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-bold text-[var(--app-primary)]">
                  Your workspace
                </h3>
                <p className="mt-2 text-sm text-[var(--app-muted)]">
                  Signed in as <strong>{currentUserEmail}</strong>. Review the activity records available to your account; the backend may not record every action.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("Audit Trail")}
                  className={`${primaryButtonClass} mt-4`}
                >
                  Review audit trail →
                </button>
              </div>
            </>
          )}

          {/* Audit Trail */}
          {active === "Audit Trail" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className={cardClass}>
                  <p className="text-sm text-[var(--app-muted)]">Events returned</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--app-primary)]">
                    {auditLogs.length}
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm text-[var(--app-muted)]">
                    Document-related events
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--app-primary)]">
                    {auditLogs.filter((log) => log.documentId).length}
                  </p>
                </div>

                <div className={cardClass}>
                  <p className="text-sm text-[var(--app-muted)]">
                    Distinct event actions
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--app-primary)]">
                    {new Set(auditLogs.map((log) => log.action)).size}
                  </p>
                </div>
              </div>

              <div className={cardClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--app-primary)]">
                      Audit event history
                    </h3>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                      Records returned by the existing audit endpoint.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void loadAuditLogs()}
                    disabled={loadingAudit}
                    className={buttonClass}
                  >
                    ↻ {loadingAudit ? "Refreshing…" : "Refresh history"}
                  </button>
                </div>

                <label className="mb-5 block max-w-xs">
                  <span className="mb-2 block text-xs font-semibold text-[var(--app-muted)]">
                    Filter by action
                  </span>
                  <select
                    value={auditFilter}
                    onChange={(event) => setAuditFilter(event.target.value)}
                    className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 text-sm outline-none focus:border-[var(--app-primary)]"
                  >
                    <option value="All">All actions</option>
                    {[...new Set(auditLogs.map((log) => log.action))]
                      .filter(Boolean)
                      .map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                  </select>
                </label>

                {filteredAuditLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--app-border)] px-4 py-12 text-center">
                    <p className="font-semibold text-[var(--app-text)]">
                      No audit events found
                    </p>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                      Events will appear here when returned by the audit API.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[var(--app-border)] text-xs uppercase tracking-wide text-[var(--app-muted)]">
                          <th className="pb-3 pr-4 font-semibold">Action</th>
                          <th className="pb-3 pr-4 font-semibold">Document</th>
                          <th className="pb-3 pr-4 font-semibold">Actor</th>
                          <th className="pb-3 font-semibold">Date & time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...filteredAuditLogs]
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                          )
                          .map((log) => (
                            <tr
                              key={log.id}
                              className="border-b border-[var(--app-border)] last:border-0"
                            >
                              <td className="py-4 pr-4">
                                <span className="inline-flex rounded-lg bg-[var(--app-accent)] px-2.5 py-1.5 text-xs font-semibold text-[var(--app-primary)]">
                                  {log.action}
                                </span>
                              </td>
                              <td className="max-w-[220px] truncate py-4 pr-4 text-[var(--app-text)]">
                                {log.fileName || log.documentId || "—"}
                              </td>
                              <td className="py-4 pr-4 text-[var(--app-muted)]">
                                {log.actor || "—"}
                              </td>
                              <td className="py-4 text-xs text-[var(--app-muted)]">
                                {formatDate(log.createdAt)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs leading-5 text-[var(--app-muted)]">
                An audit trail is only as complete as the events recorded by the
                backend. Confirm that file previews, downloads, denied requests,
                and other required security events are logged by the server.
              </p>
            </>
          )}

          {/* Settings */}
          {active === "Settings" && (
            <>
              <div className={`${cardClass} mb-6`}>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    title="Change profile photo"
                    onClick={() => avatarInput.current?.click()}
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--app-border)] bg-[var(--app-accent)] text-3xl"
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span aria-hidden="true">👤</span>
                    )}
                  </button>

                  <div>
                    <h3 className="text-xl font-bold text-[var(--app-primary)]">
                      {currentUserName}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                      {currentUserEmail}
                    </p>

                    <button
                      type="button"
                      onClick={() => avatarInput.current?.click()}
                      className="mt-3 text-sm font-semibold text-[var(--app-primary)] underline"
                    >
                      Update profile photo
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="ml-4 mt-3 text-sm font-semibold text-rose-700 underline"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--app-border)] pt-5 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                      Full name
                    </p>
                    <p className="mt-2 font-medium text-[var(--app-text)]">
                      {user?.name || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                      Email address
                    </p>
                    <p className="mt-2 break-all font-medium text-[var(--app-text)]">
                      {user?.email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                      Account created
                    </p>
                    <p className="mt-2 font-medium text-[var(--app-text)]">
                      {formatDate(user?.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                      Session
                    </p>
                    <p className="mt-2 font-medium text-[var(--app-text)]">
                      Signed in
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} mb-6`}>
                <h3 className="text-lg font-bold text-[var(--app-primary)]">
                  Workspace appearance
                </h3>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Choose a coordinated palette. The sidebar, page, cards, text, borders, buttons, and form controls update together. Theme and profile-photo preferences are saved in this browser and may not appear on other devices.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {THEME_PRESETS.map((preset) => {
                    const selected =
                      theme.sidebar === preset.theme.sidebar &&
                      theme.content === preset.theme.content &&
                      theme.primary === preset.theme.primary;

                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          saveTheme(preset.theme)
                        }
                        className={`rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-[var(--app-primary)] ring-2 ring-[var(--app-primary)]/20"
                            : "border-[var(--app-border)] hover:border-[var(--app-primary)]"
                        }`}
                      >
                        <div className="mb-3 flex h-12 overflow-hidden rounded-lg border border-black/5">
                          <div
                            className="w-1/3"
                            style={{ backgroundColor: preset.theme.sidebar }}
                          />
                          <div
                            className="flex-1"
                            style={{ backgroundColor: preset.theme.content }}
                          />
                        </div>

                        <p className="text-sm font-semibold text-[var(--app-text)]">
                          {preset.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--app-muted)]">
                          {selected ? "Selected" : "Choose palette"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 border-t border-[var(--app-border)] pt-5 md:grid-cols-2">
                  <label className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-sm font-semibold text-[var(--app-text)]">
                        Sidebar color
                      </span>
                      <span className="mt-1 block text-xs text-[var(--app-muted)]">
                        Left navigation background
                      </span>
                    </span>

                    <input
                      type="color"
                      value={theme.sidebar}
                      onChange={(event) =>
                        saveTheme({ ...theme, sidebar: event.target.value })
                      }
                      className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
                      aria-label="Choose sidebar color"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-sm font-semibold text-[var(--app-text)]">
                        Content color
                      </span>
                      <span className="mt-1 block text-xs text-[var(--app-muted)]">
                        Main page background
                      </span>
                    </span>

                    <input
                      type="color"
                      value={theme.content}
                      onChange={(event) =>
                        saveTheme({ ...theme, content: event.target.value })
                      }
                      className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
                      aria-label="Choose content color"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => saveTheme(DEFAULT_THEME)}
                  className={`${buttonClass} mt-5`}
                >
                  Reset default colors
                </button>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-bold text-[var(--app-primary)]">
                  Security reminders
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--app-muted)]">
                  <li>• Sign out when using a shared computer.</li>
                  <li>• Use a unique, strong password for your account.</li>
                  <li>• Verify document ownership and authorization on the server.</li>
                  <li>• Keep private document storage outside the public web directory.</li>
                </ul>
              </div>
            </>
          )}

          <footer className="mt-10 border-t border-[var(--app-border)] py-5 text-center text-xs text-[var(--app-muted)]">
            AuthenCrypt · Secure document workspace
          </footer>
        </div>
      </section>
      {sharingDocument && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-[var(--app-text)] shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Manage document access</h2>

        <button
          type="button"
          onClick={() => {
            setSharingDocument(null);
            setShareMessage("");
          }}
          className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--app-primary)] transition hover:bg-[var(--app-hover)]"
        >
          Close
        </button>
      </div>

      <p className="mt-2 break-words text-sm text-[var(--app-muted)]">
        Document: {sharingDocument.originalName}
      </p>

      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void updatePermission(shareEmail, "GRANT", sharePermission);
        }}
      >
        <label className="block text-sm font-medium" htmlFor="share-email">
          Recipient email
        </label>

        <input
          id="share-email"
          type="email"
          required
          value={shareEmail}
          onChange={(event) => setShareEmail(event.target.value)}
          placeholder="user@example.com"
          className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[#6b9e89]/20"
        />

        <label
          className="block text-sm font-medium"
          htmlFor="share-permission"
        >
          Permission
        </label>

        <select
          id="share-permission"
          value={sharePermission}
          onChange={(event) =>
            setSharePermission("READ")
          }
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="READ">Read — view and download</option>
        </select>

        <button
          type="submit"
          disabled={shareLoading}
          className="w-full rounded-xl bg-[var(--app-primary)] px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {shareLoading ? "Please wait..." : "Grant access"}
        </button>
      </form>

      {shareMessage && (
        <p className="mt-3 break-words text-sm" role="status">
          {shareMessage}
        </p>
      )}

      <div className="mt-6">
        <h3 className="font-semibold">Users with access</h3>

        {shareLoading && sharedUsers.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Loading permissions...</p>
        ) : sharedUsers.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No users have been granted access yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sharedUsers.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3"
              >
                <div className="min-w-0">
                  <p className="break-words font-medium">{item.user.name}</p>
                  <p className="break-words text-sm text-gray-600">
                    {item.user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Access: {item.permission}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={shareLoading}
                  onClick={() =>
                    void updatePermission(item.user.email, "REVOKE")
                  }
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
)}
    </main>

  );


}