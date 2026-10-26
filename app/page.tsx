"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [message, setMessage] = useState("Checking your secure session…");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/session", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (cancelled) return;

        // A valid session goes to the protected dashboard.
        // Visitors without a valid session see the evaluator welcome page.
        router.replace(response.ok ? "/dashboard" : "/evaluator");
      } catch {
        if (!cancelled) {
          setMessage("Unable to verify the session. Opening the welcome page…");
          router.replace("/evaluator");
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f8f6] px-6 text-slate-800">
      <section
        role="status"
        aria-live="polite"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#315c49] text-2xl font-bold text-white">
          A
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#315c49]">
          AuthenCrypt
        </h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-[#315c49]" />
        </div>
        <p className="mt-5 text-xs text-slate-500">
          Verifying your session before opening the workspace.
        </p>
      </section>
    </main>
  );
}
