import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { IconArrow } from "@/components/icons";
import { WORK } from "@/lib/content";

export const metadata: Metadata = {
  title: "Service Index",
  description: "Coaching, speaking, cancer, Simply Church, Relationship Recall and Bridgeworks. Six rooms, same job.",
};

const MORE = [
  {
    t: "The podcast",
    d: "The David Alliance. Short, unsentimental episodes on faith, leadership and getting back up.",
    href: "/podcast",
    cta: "Listen",
  },
  {
    t: "Store",
    d: "Books, downloads and merchandise. Pay what you want on WTFU. Print lives with Printify.",
    href: "/store",
    cta: "Shop",
  },
  {
    t: "Connect",
    d: "Speaking, coaching, Simply Church, Bridgeworks, or nothing in particular. Garth reads these himself.",
    href: "/contact",
    cta: "Say hello",
  },
] as const;

export default function Page() {
  return (
    <LegalShell
      title="Service Index"
      lede="Six rooms of work, plus the ways to listen, buy and get in touch. Pick a door."
    >
      <div className="wrap">
        <div className="grid g3 hair" data-rv data-stagger>
          {WORK.map((w) => (
            <div key={w.t}>
              <h2 className="card__t">{w.t}</h2>
              <p className="card__d">{w.d.split(".").slice(0, 2).join(".") + "."}</p>
              <p className="card__foot">
                <a className="tlink" href={w.href}>
                  {w.cta} <IconArrow />
                </a>
              </p>
            </div>
          ))}
        </div>

        <div className="grid g3 hair mt7" data-rv data-stagger>
          {MORE.map((item) => (
            <div key={item.t}>
              <h2 className="card__t">{item.t}</h2>
              <p className="card__d">{item.d}</p>
              <p className="card__foot">
                <a className="tlink" href={item.href}>
                  {item.cta} <IconArrow />
                </a>
              </p>
            </div>
          ))}
        </div>
      </div>
    </LegalShell>
  );
}
