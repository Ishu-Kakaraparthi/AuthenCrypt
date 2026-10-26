
import Link from "next/link";

const evaluatorEmail = "evaluator@example.com";
const evaluatorPassword = "Evaluator@123";

const steps = [
  {
    number: "01",
    title: "Sign in as Admin",
    description:
      "Use the provided administrator credentials to enter AuthenCrypt and access the features available to an admin.",
  },
  {
    number: "02",
    title: "Explore the Dashboard",
    description:
      "Get familiar with the application and navigate through the Documents, Access Control, and Audit Trail sections.",
  },
  {
    number: "03",
    title: "Explore Document Access",
    description:
      "Review available document actions and sharing permissions. Where possible, use a separate test account to check whether access follows the assigned permissions.",
  },
  {
    number: "04",
    title: "Review the Audit Trail",
    description:
      "Inspect the recorded document activities and available timestamps to understand what actions the application keeps a record of.",
  },
];

export default function EvaluatorPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#071713] text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link href="/evaluator" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-[#071713]">
              A
            </div>
            <div>
              <p className="text-lg font-bold tracking-wide">AuthenCrypt</p>
              <p className="text-xs text-emerald-300">
                Secure document workspace
              </p>
            </div>
          </Link>

          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            EVALUATOR ACCESS
          </span>
        </header>

        <section className="grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-white/[0.04] px-4 py-2 text-sm text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Project Overview · Secure Document Sharing
            </p>

            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Share documents
              <br />
              <span className="text-emerald-300">
                with confidence.
              </span>
              <br />
              Know what happened.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              When a document is shared, how do you control who can
              access it? And if someone uses it, how can you review
              the activity later?
            </p>

            <p className="mt-4 max-w-xl leading-7 text-slate-400">
              AuthenCrypt was built to address these challenges by
              bringing user authentication, document access permissions,
              and activity tracking into one application. Its purpose
              is to help protect documents and make recorded activity
              easier to review.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-emerald-300 px-6 py-3.5 font-bold text-[#071713] transition hover:bg-emerald-200"
              >
                Start evaluation →
              </Link>

              <a
                href="#evaluation-guide"
                className="rounded-xl border border-white/15 px-6 py-3.5 font-semibold text-white transition hover:bg-white/5"
              >
                View evaluation steps ↓
              </a>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["01", "Authentication"],
                ["02", "Access control"],
                ["03", "Audit trail"],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <p className="text-sm font-bold text-emerald-300">
                    {number}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-300 sm:text-sm">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-emerald-300/25 bg-[#10251f] p-5 shadow-2xl shadow-emerald-950/30 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Administrator access
                </p>
                <h2 className="mt-3 text-2xl font-bold">
                  Use this Admin Credentials
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  These credentials are provided so you can explore
                  AuthenCrypt from the administrator's perspective.
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-300/10 p-3 text-2xl">
                🔑
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
              <p className="text-sm font-semibold text-emerald-200">
                Why Admin access?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Admin privileges are assigned separately rather than
                being available through ordinary public registration.
                Regular users should only access features permitted
                to them. The admin role provides authorized access
                to administrative features, including the Audit Trail,
                so they can review recorded activities in application in between the users.
                
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#071713] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Admin Email
                </p>
                <p className="mt-2 break-all font-mono text-sm text-emerald-200 sm:text-base">
                  {evaluatorEmail}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#071713] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Admin Password
                </p>
                <p className="mt-2 break-all font-mono text-sm text-emerald-200 sm:text-base">
                  {evaluatorPassword}
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-emerald-300 px-5 py-4 font-bold text-[#071713] transition hover:bg-emerald-200"
            >
              Sign in and explore →
            </Link>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Sign in using the account above, then follow the evaluation
              guide. The account must have the ADMIN role to access
              admin-only features.
            </p>
          </aside>
        </section>

        <section
          id="evaluation-guide"
          className="scroll-mt-8 border-t border-white/10 py-12 sm:py-16"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
              Evaluation Workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Explore the project step by step.
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              Follow this sequence to understand how users, document
              permissions, and recorded activities fit together.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-emerald-300/30 hover:bg-white/[0.055]"
              >
                <p className="text-sm font-black tracking-widest text-emerald-300">
                  STEP {step.number}
                </p>
                <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-white/10 bg-[#10251f] p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-300">
            Project Goal
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            More than storing and sharing files.
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            AuthenCrypt aims to make document access more controlled
            and activity more accountable. During evaluation, check
            which documents each account can access, how permissions
            affect document actions, and what information is recorded
            in the Audit Trail.
          </p>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>AuthenCrypt · Secure document sharing with an audit trail</p>
          <p>Evaluator Guide · Project overview and workflow</p>
        </footer>
      </div>
    </main>
  );
}
