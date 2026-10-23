
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

      // Upload succeeded. Refreshing the dashboard is a separate action.
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
    <section className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9f4ec] text-xl">
          <span aria-hidden="true">↑</span>
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#253d30]">
            Upload a document
          </h2>
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
            dragging
              ? "border-[#477b58] bg-[#edf7ef]"
              : "border-[#cbdccf] bg-[#f8fbf8] hover:border-[#7da88a] hover:bg-[#f1f7f2]"
          } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e5f0e7] text-2xl text-[#477b58]">
            <span aria-hidden="true">⇧</span>
          </div>

          <p className="mt-3 font-semibold text-[#304a38]">
            {file ? "File selected" : "Drag and drop your file here"}
          </p>

          <p className="mt-1 text-sm text-[#718176]">
            or click to browse your computer
          </p>

          {file && (
            <div className="mx-auto mt-4 max-w-full rounded-xl border border-[#dce8df] bg-white px-4 py-3 text-left sm:max-w-md">
              <p className="truncate text-sm font-semibold text-[#304a38]">
                {file.name}
              </p>
              <p className="mt-1 text-xs text-[#718176]">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-[#849287]">
            PDF, PNG, JPEG or TXT · Maximum 5 MB
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-xl bg-[#477b58] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#386647] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="rounded-xl border border-[#dce8df] px-4 py-3 text-sm font-medium text-[#526557] transition hover:bg-[#f5f8f5]"
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
          className={`mt-4 rounded-xl p-3 text-sm ${
            success
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-[#849287]">
        Only upload documents you are authorized to share. File validation
        in the browser is for convenience; the server must validate files
        independently.
      </p>
    </section>
  );
}
