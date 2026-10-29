"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "@/components/icons";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type RecoveryParams = {
  tokenHash: string | null;
  type: string | null;
  code: string | null;
  access: string | null;
  refresh: string | null;
  next: string | null;
  authError: string | null;
};

function readRecoveryParams(): RecoveryParams {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    tokenHash: query.get("token_hash"),
    type: query.get("type"),
    code: query.get("code"),
    access: hash.get("access_token"),
    refresh: hash.get("refresh_token"),
    next: query.get("next"),
    authError: hash.get("error_description") || query.get("error_description"),
  };
}

export default function CustomerResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const started = useRef(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    // Recovery tokens are one-time. Guard against React remount / Strict Mode double-run.
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    async function establish() {
      const params = readRecoveryParams();
      if (params.next) setNextPath(params.next);

      if (params.authError) {
        if (!cancelled) {
          setError(params.authError);
          setChecking(false);
        }
        return;
      }

      // Remount after a successful verify: session is already there, URL tokens were cleared.
      const existing = await supabase.auth.getSession();
      if (existing.data.session) {
        if (!cancelled) {
          setReady(true);
          setChecking(false);
        }
        return;
      }

      const result =
        params.tokenHash && params.type
          ? await supabase.auth.verifyOtp({
              token_hash: params.tokenHash,
              type: params.type as "recovery",
            })
          : params.access && params.refresh
            ? await supabase.auth.setSession({
                access_token: params.access,
                refresh_token: params.refresh,
              })
            : params.code
              ? await supabase.auth.exchangeCodeForSession(params.code)
              : { error: new Error("Missing recovery link"), data: { session: null } };

      if (cancelled) return;

      if (result.error) {
        // Race: another run may have already established the session.
        const again = await supabase.auth.getSession();
        if (again.data.session) {
          setReady(true);
          setError("");
        } else {
          setError("This reset link is invalid or expired. Request a new one from the sign-in page.");
          setReady(false);
        }
      } else {
        setReady(true);
        setError("");
        window.history.replaceState(
          {},
          document.title,
          params.next
            ? `/account/reset-password?next=${encodeURIComponent(params.next)}`
            : "/account/reset-password",
        );
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
    router.replace(nextPath && nextPath.startsWith("/") ? nextPath : "/account/login?reset=1");
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
