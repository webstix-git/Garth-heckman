"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TurnstileField, resetTurnstile } from "@/components/TurnstileField";

/** Standalone contact form — posts to same-origin /api/contact (server holds the store key). */
export function ContactForm() {
  const router = useRouter();
  const turnstileEnabled = Boolean(String(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim());
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    // Collect every named input — backend stores the full snapshot in jsonb `fields`.
    const fields: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value !== "string") continue;
      if (key === "cf-turnstile-response") continue;
      fields[key] = value.trim();
    }
    const name = fields.name ?? "";
    const email = fields.email ?? "";
    const phone = fields.phone ?? "";
    if (!name || !email || !phone) {
      setState("error");
      setMessage("Please complete your name, email, and phone.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      setState("error");
      setMessage("Please enter a valid phone number.");
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      setState("error");
      setMessage("Please complete the security check.");
      return;
    }

    setState("sending");
    setMessage("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formTitle: "Contact Form",
          ...fields,
          fields,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to send your message.");
      formElement.reset();
      setTurnstileToken(null);
      resetTurnstile();
      router.push("/thank-you");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to send your message.");
      setTurnstileToken(null);
      resetTurnstile();
    }
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <p className="meta meta--gold">Send a message</p>
      <p className="body sm mt2 dim">Fields marked with an asterisk (*) are required.</p>
      <div className="field-row mt4">
        <div className="field">
          <label className="label" htmlFor="contact-name">
            Name:<span className="req">*</span>
          </label>
          <input className="input" id="contact-name" name="name" autoComplete="name" placeholder="Enter your name" required />
        </div>
        <div className="field">
          <label className="label" htmlFor="contact-email">
            Email:<span className="req">*</span>
          </label>
          <input
            className="input"
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="your.email@example.com"
            required
          />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label className="label" htmlFor="contact-phone">
            Phone:<span className="req">*</span>
          </label>
          <input
            className="input"
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Your phone number"
            required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="contact-company">
            Company:
          </label>
          <input className="input" id="contact-company" name="company" autoComplete="organization" placeholder="Optional" />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="contact-subject">
          Subject: <span className="dim" style={{ fontWeight: 500, letterSpacing: 0, textTransform: "none" }}>(optional)</span>
        </label>
        <input
          className="input"
          id="contact-subject"
          name="subject"
          placeholder="Optional"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="contact-message">
          Message: <span className="dim" style={{ fontWeight: 500, letterSpacing: 0, textTransform: "none" }}>(optional)</span>
        </label>
        <textarea
          className="textarea"
          id="contact-message"
          name="message"
          placeholder="Optional"
        />
      </div>
      <TurnstileField action="contact" theme="auto" onToken={setTurnstileToken} />
      {state !== "idle" && (
        <div className={`notice ${state === "error" ? "notice--bad" : "notice--info"} mt3`}>
          <span>{state === "sending" ? "Sending your message…" : message}</span>
        </div>
      )}
      <button
        className="btn btn--lg btn--block mt4"
        type="submit"
        disabled={state === "sending" || (turnstileEnabled && !turnstileToken)}
      >
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
