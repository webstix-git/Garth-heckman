"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function AccountSetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const token = params.get("token") || "";
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setSaving(true); setError("");
    const response = await fetch("/api/customer/account/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Could not set up your account."); setSaving(false); return; }
    router.replace("/account/login?setup=1");
  }

  return <main className="sec"><div className="wrap-n" style={{ maxWidth: 560 }}><div className="card"><p className="meta meta--gold">Account setup</p><h1 className="d3 mt2">Create your password</h1><p className="body sm mt2">Use this account to view your purchases and order history.</p><form className="mt5" onSubmit={submit}><div className="field"><label className="label" htmlFor="password">Password</label><input className="input" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></div><div className="field mt3"><label className="label" htmlFor="confirm">Confirm password</label><input className="input" id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} /></div>{error ? <p className="mt3" role="alert">{error}</p> : null}<button className="btn mt4" type="submit" disabled={saving}>{saving ? "Saving…" : "Create account"}</button></form></div></div></main>;
}

export default function CustomerAccountSetupPage() {
  return (
    <Suspense fallback={<main className="sec"><div className="wrap-n" style={{ maxWidth: 560 }}><div className="card"><p className="meta meta--gold">Account setup</p><h1 className="d3 mt2">Create your password</h1><p className="body sm mt2">Loading…</p></div></div></main>}>
      <AccountSetupForm />
    </Suspense>
  );
}
