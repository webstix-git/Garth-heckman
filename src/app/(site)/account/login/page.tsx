"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconEye, IconEyeOff } from "@/components/icons";

function CustomerLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Invalid email or password");
      setSaving(false);
      return;
    }
    router.replace("/account");
    router.refresh();
  }

  return (
    <main className="sec">
      <div className="wrap-n" style={{ maxWidth: 560 }}>
        <div className="card">
          <p className="meta meta--gold">My account</p>
          <h1 className="d3 mt2">Sign in</h1>
          {params.get("setup") ? (
            <p className="body sm mt2">Your account is ready. Sign in to view your purchases.</p>
          ) : null}
          <form className="mt5" onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                className="input"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field mt3">
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="input-wrap">
                <input
                  className="input"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="input-wrap__toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            {error ? (
              <p className="mt3" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn mt4" type="submit" disabled={saving}>
              {saving ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="body sm mt4">
            Need to set up your account? Complete a purchase first, then use the setup link from your order email.
          </p>
          <Link className="btn btn--line btn--sm mt3" href="/store">
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="sec">
          <div className="wrap-n" style={{ maxWidth: 560 }}>
            <div className="card">
              <p className="meta meta--gold">My account</p>
              <h1 className="d3 mt2">Sign in</h1>
              <p className="body sm mt2">Loading…</p>
            </div>
          </div>
        </main>
      }
    >
      <CustomerLoginForm />
    </Suspense>
  );
}
