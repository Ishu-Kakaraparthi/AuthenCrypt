"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";

type UploadFormProps = {
  onUploadSuccess: () => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
];

export default function UploadForm({
  onUploadSuccess,
}: UploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);

  function chooseFile(selectedFile?: File) {
    if (!selectedFile) return;

    setMessage("");
    setSuccess(false);

    const extensionAllowed = /\.(pdf|png|jpe?g|txt)$/i.test(
      selectedFile.name
    );

    if (
      !extensionAllowed ||
      !ALLOWED_TYPES.includes(selectedFile.type)
    ) {
      setFile(null);
      setMessage("Choose a PDF, PNG, JPEG, or TXT file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setMessage("File size must not exceed 5 MB.");
      return;
    }

    setFile(selectedFile);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (loading) return;

    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setMessage("Please choose a file first.");
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(result.error || "Upload failed. Please try again.");
        return;
      }

      setSuccess(true);
      setMessage(result.message || "Document uploaded successfully.");
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      try {
        onUploadSuccess();
      } catch (refreshError) {
        console.error("Document list refresh failed:", refreshError);
      }
    } catch (error) {
      console.error("Upload request error:", error);
      setMessage("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="rounded-2xl border p-5 shadow-sm sm:p-6"
      style={{
        backgroundColor: "var(--app-surface, #ffffff)",
        borderColor: "var(--app-border, #e2e8f0)",
        color: "var(--app-text, #1e293b)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{
            backgroundColor: "var(--app-accent, #e5f0e3)",
            color: "var(--app-primary, #315c49)",
          }}
        >
          <span aria-hidden="true">↑</span>
        </div>

        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--app-text, #1e293b)" }}>
            Upload a document
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--app-muted, #64748b)" }}>
            Securely add a document to your workspace.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="mt-5">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={handleFileChange}
          disabled={loading}
          className="sr-only"
          aria-label="Choose a document"
        />

        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!loading) setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setDragging(false);
            }
          }}
          onDrop={handleDrop}
          onClick={() => {
            if (!loading) inputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (
              (event.key === "Enter" || event.key === " ") &&
              !loading
            ) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={loading ? -1 : 0}
          aria-label="Choose a file or drag and drop it here"
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition sm:p-9 ${
            loading ? "cursor-not-allowed opacity-60" : ""
          }`}
          style={{
            borderColor: dragging
              ? "var(--app-primary, #315c49)"
              : "var(--app-border, #e2e8f0)",
            backgroundColor: dragging
              ? "var(--app-accent, #e5f0e3)"
              : "var(--app-input, #ffffff)",
          }}
        >
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl"
            style={{
              backgroundColor: "var(--app-accent, #e5f0e3)",
              color: "var(--app-primary, #315c49)",
            }}
          >
            <span aria-hidden="true">⇧</span>
          </div>

          <p className="mt-3 font-semibold" style={{ color: "var(--app-text, #1e293b)" }}>
            {file ? "File selected" : "Drag and drop your file here"}
          </p>

          <p className="mt-1 text-sm" style={{ color: "var(--app-muted, #64748b)" }}>
            or click to browse your computer
          </p>

          {file && (
            <div
              className="mx-auto mt-4 max-w-full rounded-xl border px-4 py-3 text-left sm:max-w-md"
              style={{
                borderColor: "var(--app-border, #e2e8f0)",
                backgroundColor: "var(--app-surface, #ffffff)",
              }}
            >
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--app-muted, #64748b)" }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          <p className="mt-4 text-xs" style={{ color: "var(--app-muted, #64748b)" }}>
            PDF, PNG, JPEG or TXT · Maximum 5 MB
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: "var(--app-primary, #315c49)",
            }}
            onMouseEnter={(event) => {
              if (!loading && file) {
                event.currentTarget.style.backgroundColor =
                  "var(--app-primary-hover, #264a39)";
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor =
                "var(--app-primary, #315c49)";
            }}
          >
            {loading ? "Uploading..." : "Upload document"}
          </button>

          {file && !loading && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setMessage("");
                setSuccess(false);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-xl border px-4 py-3 text-sm font-medium transition"
              style={{
                borderColor: "var(--app-border, #e2e8f0)",
                color: "var(--app-text, #1e293b)",
              }}
            >
              Remove selected file
            </button>
          )}
        </div>
      </form>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl border p-3 text-sm"
          style={
            success
              ? {
                  borderColor: "#a7f3d0",
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                }
              : {
                  borderColor: "#fecdd3",
                  backgroundColor: "#fff1f2",
                  color: "#9f1239",
                }
          }
        >
          {message}
        </p>
      )}

      <p className="mt-4 text-xs leading-5" style={{ color: "var(--app-muted, #64748b)" }}>
        Only upload documents you are authorized to share. File validation
        in the browser is for convenience; the server must validate files
        independently.
      </p>
    </section>
  );
}