"use client";

import { usePathname } from "next/navigation";
import { IconArrow } from "@/components/icons";
import { ASK_GARTH_HREF } from "@/lib/links";

export function AskBar() {
  const path = usePathname();
  const here = path === ASK_GARTH_HREF;

  return (
    <a className="askbar" href={here ? "#topics" : ASK_GARTH_HREF} {...(here ? { "aria-current": "page" as const } : {})}>
      <span className="askbar__in">
        <span className="askbar__copy">
          <span className="askbar__kicker">Straight from Garth</span>
          <span className="askbar__line">Five topics. Five questions. Five answers.</span>
        </span>
        <span className="askbar__go">
          {here ? "Jump in" : "Read them"} <IconArrow />
        </span>
      </span>
    </a>
  );
}
