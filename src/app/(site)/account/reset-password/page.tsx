"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "@/components/icons";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function CustomerResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function establish() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const authError = hash.get("error_description");
      if (authError) {
        if (!cancelled) {
          setError(authError);
          setChecking(false);
        }
        return;
      }
      const code = new URLSearchParams(window.location.search).get("code");
      const access = hash.get("access_token");
      const refresh = hash.get("refresh_token");
      const result =
        access && refresh
          ? await supabase.auth.setSession({ access_token: access, refresh_token: refresh })
          : code
            ? await supabase.auth.exchangeCodeForSession(code)
            : { error: new Error("Missing recovery link") };
      if (cancelled) return;
      if (result.error) {
        setError("This reset link is invalid or expired. Request a new one from the sign-in page.");
        setReady(false);
      } else {
        setReady(true);
        window.history.replaceState({}, document.title, "/account/reset-password");
      }
      setChecking(false);
    }
    void establish();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!ready) {
      setError("This reset link is invalid or expired. Request a new one.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "Unable to update password.");
      setSaving(false);
      return;
    }
    await supabase.auth.signOut();
    router.replace("/account/login?reset=1");
    router.refresh();
  }

  return (
    <main className="sec">
      <div className="wrap-n" style={{ maxWidth: 560 }}>
        <div className="card">
          <p className="meta meta--gold">My account</p>
          <h1 className="d3 mt2">Set a new password</h1>
          <p className="body sm mt2">Choose a new password for your purchases and downloads.</p>

          {checking ? <p className="body sm mt4">Checking reset link…</p> : null}

          {!checking && error && !ready ? (
            <div className="mt4">
              <p role="alert">{error}</p>
              <p className="mt4">
                <Link className="btn btn--line btn--sm" href="/account/login?forgot=1">
                  Request a new reset link
                </Link>
              </p>
            </div>
          ) : null}

          {!checking && ready ? (
            <form className="mt5" onSubmit={submit}>
              <div className="field">
                <label className="label" htmlFor="password">
                  New password
                </label>
                <div className="input-wrap">
                  <input
                    className="input"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
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
                <p className="hint">At least 8 characters.</p>
              </div>
              <div className="field mt3">
                <label className="label" htmlFor="confirm">
                  Confirm password
                </label>
                <div className="input-wrap">
                  <input
                    className="input"
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    className="input-wrap__toggle"
                    type="button"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirm((value) => !value)}
                  >
                    {showConfirm ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>
              {error ? (
                <p className="mt3" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="btn mt4" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Update password"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
