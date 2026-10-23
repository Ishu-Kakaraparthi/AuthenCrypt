"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const officeImage =
  "https://png.pngtree.com/thumb_back/fh260/background/20260726/pngtree-modern-open-plan-office-with-diverse-employees-working-and-collaborating-in-image_22088212.webp";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Registration failed. Please try again.");
        return;
      }

      router.push("/login");
    } catch {
      setMessage("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f8f3] text-[#27352b]">
      <div className="auth-page">
        <section className="auth-visual">
          <img
            src={officeImage}
            alt="People collaborating in a modern office"
            className="auth-photo"
          />
          <div className="auth-image-overlay" />
          <div className="auth-glow auth-glow-one" />
          <div className="auth-glow auth-glow-two" />

          <Link href="/register" className="visual-brand">
            <span className="brand-symbol">A</span>
            <span>Authen<span className="brand-gold">Crypt</span></span>
          </Link>

          <div className="visual-copy">
            <span className="eyebrow">
              <span className="status-dot" />
              A BETTER WAY TO WORK SECURELY
            </span>

            <h1>
              Make room
              <br />
              for <span>peace of mind.</span>
            </h1>

            <p>
              Bring your important documents into one secure workspace.
              Organize files, manage access, and keep track of document activity
              as you work.
            </p>

            <div className="visual-features">
              <span><span className="feature-check">✓</span> Private files</span>
              <span><span className="feature-check">✓</span> Access control</span>
              <span><span className="feature-check">✓</span> Audit records</span>
            </div>
          </div>

          <div className="visual-footer">
            <span>BUILT AROUND TRUST.</span>
            <span>DESIGNED FOR CONTROL.</span>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="mobile-brand">
            <span className="brand-symbol">A</span>
            <span>Authen<span className="brand-green">Crypt</span></span>
          </div>

          <div className="form-content">
            <div className="form-heading">
              <span className="form-kicker">START YOUR SECURE WORKSPACE</span>
              <h2>Create your account<span className="heading-period">.</span></h2>
              <p>A few details, then you&apos;re ready to get started.</p>
            </div>

            <form onSubmit={handleRegister} className="auth-form">
              <div className="field-group">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="field-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="field-group">
                <label htmlFor="password">Create password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                />
                <span className="password-hint">
                  Use at least 12 characters.
                </span>
              </div>

              {message && (
                <p role="alert" className="form-error">{message}</p>
              )}

              <button type="submit" disabled={loading} className="auth-submit">
                <span>{loading ? "Creating account..." : "Create your account"}</span>
                {!loading && <span className="button-arrow">↗</span>}
              </button>
            </form>

            <div className="secure-note">
              <span className="secure-icon">✳</span>
              Your workspace is designed to put document access in your control.
            </div>

            <p className="switch-auth">
              Already have an account?{" "}
              <Link href="/login">Sign in <span>→</span></Link>
            </p>
          </div>

          <footer className="panel-footer">
            <span>© AuthenCrypt</span>
            <span>SECURE DOCUMENT MANAGEMENT</span>
          </footer>
        </section>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }

        .auth-page {
          display: grid;
          grid-template-columns: minmax(0, 1.16fr) minmax(390px, 0.84fr);
          min-height: 100vh;
          background: #f8f8f3;
          color: #27352b;
          overflow: hidden;
        }

        .auth-visual {
          position: relative;
          isolation: isolate;
          display: flex;
          min-height: 100vh;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          padding: clamp(28px, 4.2vw, 64px);
          background: #1b3022;
          color: white;
        }

        .auth-photo {
          position: absolute;
          z-index: -3;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: officeReveal 1.2s ease-out both, officeDrift 24s ease-in-out 1.2s infinite alternate;
        }

        .auth-image-overlay {
          position: absolute;
          z-index: -2;
          inset: 0;
          background: linear-gradient(115deg, rgba(15,34,22,.88), rgba(24,49,32,.66) 54%, rgba(17,31,22,.47));
        }

        .auth-glow {
          position: absolute;
          z-index: -1;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: rgba(208,201,142,.17);
          filter: blur(75px);
          pointer-events: none;
          animation: glowDrift 10s ease-in-out infinite alternate;
        }

        .auth-glow-one { top: 18%; right: -100px; }
        .auth-glow-two { bottom: 4%; left: -100px; animation-delay: -4s; }

        .visual-brand, .mobile-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          width: fit-content;
          font-size: 23px;
          font-weight: 750;
          letter-spacing: -0.7px;
          text-decoration: none;
        }

        .brand-symbol {
          display: inline-flex;
          width: 43px;
          height: 43px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.4);
          border-radius: 14px;
          background: rgba(255,255,255,.15);
          color: #fff;
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          backdrop-filter: blur(12px);
        }

        .brand-gold { color: #e7d58f; }
        .brand-green { color: #4e7255; }

        .visual-copy {
          width: 100%;
          max-width: 630px;
          margin: 45px 0;
          animation: copyReveal .85s .15s both;
        }

        .eyebrow, .form-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #e1d49a;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 2px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c9d9a0;
          box-shadow: 0 0 14px rgba(201,217,160,.7);
        }

        .visual-copy h1 {
          margin: 25px 0 20px;
          font-size: clamp(42px, 4.6vw, 68px);
          font-weight: 650;
          letter-spacing: -2.6px;
          line-height: 1.08;
        }

        .visual-copy h1 span { color: #e6d58f; }

        .visual-copy > p {
          max-width: 470px;
          color: rgba(255,255,255,.78);
          font-size: 14px;
          line-height: 1.9;
        }

        .visual-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 20px;
          margin-top: 27px;
        }

        .visual-features > span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,.9);
          font-size: 12px;
        }

        .feature-check { color: #e6d58f; font-weight: 800; }

        .visual-footer, .panel-footer {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          color: rgba(255,255,255,.63);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.3px;
        }

        .auth-form-panel {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 100vh;
          flex-direction: column;
          justify-content: center;
          padding: clamp(28px, 4vw, 60px);
          background: linear-gradient(145deg, #fbfbf7, #f1f3e9);
        }

        .form-content {
          width: 100%;
          max-width: 410px;
          margin: auto;
          animation: copyReveal .8s .1s both;
        }

        .form-kicker {
          color: #74836a;
          font-size: 10px;
          letter-spacing: 1.7px;
        }

        .form-heading h2 {
          margin: 15px 0 10px;
          font-size: clamp(30px, 2.8vw, 39px);
          font-weight: 700;
          letter-spacing: -1.6px;
          line-height: 1.15;
          color: #26362b;
        }

        .heading-period { color: #b5a04e; }

        .form-heading p {
          margin: 0;
          color: #7a8279;
          font-size: 13px;
          line-height: 1.7;
        }

        .auth-form { display: grid; gap: 18px; margin-top: 29px; }
        .field-group { display: grid; gap: 8px; }

        .field-group label {
          color: #3d4d40;
          font-size: 12px;
          font-weight: 700;
        }

        .field-group input {
          width: 100%;
          min-height: 49px;
          padding: 0 15px;
          border: 1px solid #dfe4d9;
          border-radius: 12px;
          background: rgba(255,255,255,.85);
          color: #26362b;
          font: inherit;
          font-size: 13px;
          outline: none;
          transition: border-color .25s, box-shadow .25s, background .25s, transform .25s;
        }

        .field-group input::placeholder { color: #a2a99f; }

        .field-group input:focus {
          border-color: #789078;
          background: white;
          box-shadow: 0 0 0 4px rgba(102,133,103,.12);
          transform: translateY(-1px);
        }

        .password-hint {
          color: #858b80;
          font-size: 10px;
          line-height: 1.5;
        }

        .auth-submit {
          display: flex;
          width: 100%;
          min-height: 52px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 3px;
          padding: 0 18px;
          border: 0;
          border-radius: 12px;
          background: #344f3b;
          color: white;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(52,79,59,.16);
          transition: transform .25s, background .25s, box-shadow .25s;
        }

        .auth-submit:hover {
          transform: translateY(-2px);
          background: #263f2e;
          box-shadow: 0 12px 24px rgba(52,79,59,.23);
        }

        .auth-submit:active { transform: translateY(0); }
        .auth-submit:disabled { cursor: not-allowed; opacity: .65; }
        .button-arrow { color: #e7d58f; font-size: 19px; transition: transform .25s; }
        .auth-submit:hover .button-arrow { transform: translate(3px, -3px); }

        .form-error {
          margin: -3px 0 0;
          padding: 12px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.5;
        }

        .secure-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 23px;
          color: #858b80;
          font-size: 10px;
          line-height: 1.7;
        }

        .secure-icon { color: #a3934e; font-size: 16px; }

        .switch-auth {
          margin-top: 25px;
          color: #81877d;
          font-size: 12px;
          line-height: 1.8;
        }

        .switch-auth a {
          color: #45664b;
          font-weight: 750;
          text-decoration: none;
          transition: color .2s;
        }

        .switch-auth a:hover { color: #a18b3f; }
        .switch-auth a span { display: inline-block; transition: transform .2s; }
        .switch-auth a:hover span { transform: translateX(4px); }

        .panel-footer {
          margin-top: 30px;
          color: #969c91;
          font-size: 8px;
        }

        .mobile-brand { display: none; }

        @keyframes copyReveal {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes officeReveal {
          from { opacity: .55; transform: scale(1.05); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes officeDrift {
          from { transform: scale(1); }
          to { transform: scale(1.055); }
        }

        @keyframes glowDrift {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(22px, -20px, 0); }
        }

        @media (max-width: 850px) {
          .auth-page { grid-template-columns: minmax(0, 1fr) minmax(320px, .95fr); }
          .auth-visual { padding: 27px; }
          .visual-copy h1 { font-size: 43px; }
          .auth-form-panel { padding: 27px; }
          .visual-features { gap: 12px; }
        }

        @media (max-width: 680px) {
          .auth-page {
            grid-template-columns: minmax(0, 1fr);
            overflow: visible;
          }

          .auth-visual {
            min-height: 32vh;
            padding: 22px 24px;
          }

          .visual-copy { margin: 30px 0 18px; }
          .visual-copy h1 { margin: 14px 0 10px; font-size: clamp(32px, 8vw, 44px); letter-spacing: -1.5px; }
          .visual-copy > p { max-width: 480px; font-size: 12px; line-height: 1.65; }
          .visual-copy .eyebrow { font-size: 8px; letter-spacing: 1px; }
          .visual-features { margin-top: 13px; gap: 8px 13px; }
          .visual-features > span { font-size: 10px; }
          .visual-footer { display: none; }
          .visual-brand { font-size: 19px; }
          .brand-symbol { width: 36px; height: 36px; border-radius: 11px; }

          .auth-form-panel {
            min-height: 68vh;
            padding: 32px 24px 24px;
          }

          .form-content { max-width: 460px; }
          .form-heading h2 { font-size: 32px; }
          .auth-form { margin-top: 23px; gap: 15px; }
          .panel-footer { margin-top: 25px; }
        }

        @media (max-width: 380px) {
          .auth-visual { padding: 19px; }
          .auth-form-panel { padding: 27px 19px 22px; }
          .visual-copy h1 { font-size: 30px; }
          .visual-features { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}