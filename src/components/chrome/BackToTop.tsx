"use client";

import { useEffect, useState } from "react";
import { IconArrowUp } from "@/components/icons";

const SHOW_AFTER = 480;

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function update() {
      setShow(window.scrollY > SHOW_AFTER);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  function goTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      className={`totop${show ? " show" : ""}`}
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={goTop}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
    >
      <IconArrowUp />
    </button>
  );
}
