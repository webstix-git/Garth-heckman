"use client";

import { useState } from "react";

/** Standalone contact form — posts to same-origin /api/contact (server holds the store key). */
export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const body = String(form.get("message") ?? "").trim();
    if (!name || !email || !subject || !body) {
      setState("error");
      setMessage("Please complete your name, email, subject, and message.");
      return;
    }

    setState("sending");
    setMessage("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: String(form.get("phone") ?? "").trim() || undefined,
          subject,
          message: body,
          acceptsMarketing: form.get("acceptsMarketing") === "on",
          fields: {
            ...(String(form.get("company") ?? "").trim() ? { company: String(form.get("company")).trim() } : {}),
            ...(String(form.get("orderNumber") ?? "").trim() ? { "order-number": String(form.get("orderNumber")).trim() } : {}),
          },
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to send your message.");
      event.currentTarget.reset();
      setState("sent");
      setMessage("Thanks — your message has been sent.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to send your message.");
    }
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <p className="meta meta--gold">Send a message</p>
      <div className="field-row mt4">
        <div className="field">
          <label className="label" htmlFor="contact-name">Name<span className="req">*</span></label>
          <input className="input" id="contact-name" name="name" autoComplete="name" placeholder="Enter your name" required />
        </div>
        <div className="field">
          <label className="label" htmlFor="contact-email">Email<span className="req">*</span></label>
          <input className="input" id="contact-email" name="email" type="email" autoComplete="email" placeholder="your.email@example.com" required />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label className="label" htmlFor="contact-phone">Phone</label>
          <input className="input" id="contact-phone" name="phone" type="tel" autoComplete="tel" placeholder="Optional" />
        </div>
        <div className="field">
          <label className="label" htmlFor="contact-company">Company</label>
          <input className="input" id="contact-company" name="company" autoComplete="organization" placeholder="Optional" />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="contact-order">Order number</label>
        <input className="input" id="contact-order" name="orderNumber" placeholder="Optional" />
      </div>
      <div className="field">
        <label className="label" htmlFor="contact-subject">Subject<span className="req">*</span></label>
        <input className="input" id="contact-subject" name="subject" placeholder="How can we help?" required />
      </div>
      <div className="field">
        <label className="label" htmlFor="contact-message">Message<span className="req">*</span></label>
        <textarea className="textarea" id="contact-message" name="message" required placeholder="Tell us how we can help." />
      </div>
      <div className="field">
        <label className="check">
          <input name="acceptsMarketing" type="checkbox" />
          <span>Send me store updates by email.</span>
        </label>
      </div>
      {state !== "idle" && (
        <div className={`notice ${state === "sent" ? "notice--ok" : state === "error" ? "notice--bad" : "notice--info"} mt3`}>
          <span>{state === "sending" ? "Sending your message…" : message}</span>
        </div>
      )}
      <button className="btn btn--lg btn--block mt4" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
