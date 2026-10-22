import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { ASK_TOPICS } from "@/lib/ask-garth";
import { ASK_GARTH_MAILTO, GARTH_EMAIL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Straight from Garth",
  description:
    "Five topics, five questions, five answers. Nutrition, training, personal development, spiritual life, and marriage, in his own words.",
};

function Inline({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const token = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(token)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const piece = match[0];
    if (piece.startsWith("**")) {
      nodes.push(<strong key={key}>{piece.slice(2, -2)}</strong>);
    } else {
      const link = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <a key={key} href={link[2]}>
            {link[1]}
          </a>,
        );
      }
    }
    key += 1;
    last = index + piece.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function Answer({ text }: { text: string }) {
  return (
    <div className="qa__a prose">
      {text.split(/\n\n+/).map((paragraph, i) => (
        <p key={i}>
          <Inline text={paragraph} />
        </p>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <SiteChrome nav="">
      <main id="main">
        <section className="phead on-dark grain">
          <div className="wrap">
            <nav className="crumbs meta mb4" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <s>/</s>
              <span>Straight from Garth</span>
            </nav>
            <p className="meta meta--gold">Five topics. Five questions. Five answers.</p>
            <h1 className="d2 mt3">Straight from Garth</h1>
            <p className="lede mt5 mw-l dim">
              Nutrition, training, personal development, spiritual life, and marriage. Five answers each, in his own
              words. When you are done, ask him yours.
            </p>
          </div>
        </section>

        <nav className="askjump" id="topics" aria-label="Topics">
          <div className="askjump__in">
            {ASK_TOPICS.map((topic, i) => (
              <a key={topic.id} href={`#${topic.id}`}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{topic.title}</span>
              </a>
            ))}
          </div>
        </nav>

        {ASK_TOPICS.map((topic, i) => (
          <section key={topic.id} className={`sec asktopic${i % 2 === 1 ? " tint" : ""}`} id={topic.id}>
            <div className="wrap-n">
              <header data-rv="">
                <p className="meta meta--gold">
                  {String(i + 1).padStart(2, "0")} / 05
                </p>
                <h2 className="d2 mt2">{topic.title}</h2>
              </header>
              <div className="mt5">
                {topic.questions.map((item, q) => (
                  <article className="qa" key={item.q} data-rv="">
                    <p className="qa__n">{String(q + 1).padStart(2, "0")}</p>
                    <div>
                      <h3 className="qa__q">{item.q}</h3>
                      {item.kicker ? <p className="qa__kicker">{item.kicker}</p> : null}
                      <Answer text={item.a} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="band" id="ask">
          <div className="wrap band__in">
            <div>
              <p className="meta">Your turn</p>
              <p className="d3 mt2">Do you have a question for Garth?</p>
              <p className="askend__mail mt3">
                <a href={ASK_GARTH_MAILTO}>{GARTH_EMAIL}</a>
              </p>
            </div>
            <div className="row">
              <a className="btn btn--ink btn--lg" href={ASK_GARTH_MAILTO}>
                Ask him here
              </a>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
