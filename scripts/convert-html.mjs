/**
 * Convert Prototype HTML mains into JSX strings for Next.js pages.
 */
import fs from "node:fs";
import path from "node:path";

const proto = path.resolve("c:/Next-js-projects/garth-heckman/Prototype");
const app = path.resolve("c:/Next-js-projects/garth-heckman/web/src/app");

const PAGES = [
  { file: "speaking.html", route: "speaking", nav: "speaking" },
  { file: "coaching.html", route: "coaching", nav: "work" },
  { file: "simply-church.html", route: "simply-church", nav: "work" },
  { file: "relationship-recall.html", route: "relationship-recall", nav: "work" },
  { file: "bridgeworks.html", route: "bridgeworks", nav: "work" },
  { file: "cancer.html", route: "cancer", nav: "work" },
  { file: "story.html", route: "story", nav: "story" },
  { file: "blog-post.html", route: "blog-post", nav: "blog" },
  { file: "contact.html", route: "contact", nav: "connect" },
  { file: "style-guide.html", route: "style-guide", nav: "" },
];

function rewriteHref(href) {
  if (!href) return href;
  if (
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#") ||
    href.startsWith("/")
  )
    return href;
  if (href === "index.html") return "/";
  const product = href.match(/^product\.html\?slug=([^&]+)/);
  if (product) return `/product/${product[1]}`;
  const page = href.match(/^([a-z0-9-]+)\.html(.*)$/i);
  if (page) return `/${page[1]}${page[2]}`;
  if (href.startsWith("assets/")) return `/${href}`;
  return href;
}

function cssToJsx(style) {
  const parts = [];
  style.split(";").forEach((rule) => {
    const idx = rule.indexOf(":");
    if (idx < 0) return;
    const k = rule.slice(0, idx).trim();
    const v = rule.slice(idx + 1).trim();
    if (!k || !v) return;
    const prop = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const num = /^-?\d+(\.\d+)?$/.test(v);
    parts.push(`${prop}: ${num ? v : JSON.stringify(v)}`);
  });
  return `{{ ${parts.join(", ")} }}`;
}

function htmlToJsx(html) {
  html = html.replace(/<!--([\s\S]*?)-->/g, (_, c) => {
    const safe = c.replace(/\*\//g, "* /").trim();
    if (!safe) return "";
    return `{/* ${safe} */}`;
  });

  html = html.replace(/<(img|br|hr|input|source|col|area)(\s[^>]*?)?\s*\/?>/gi, (_, tag, attrs) => {
    return `<${tag}${attrs || ""} />`;
  });

  html = html.replace(/\sclass=/g, " className=");
  html = html.replace(/\sfor=/g, " htmlFor=");
  html = html.replace(/\ttabindex=/g, " tabIndex=");
  html = html.replace(/\stabindex=/g, " tabIndex=");
  html = html.replace(/\tcolspan=/g, " colSpan=");
  html = html.replace(/\scolspan=/g, " colSpan=");
  html = html.replace(/\tautoComplete=/gi, " autoComplete=");
  html = html.replace(/\tautocomplete=/g, " autoComplete=");
  html = html.replace(/\tspellcheck=/g, " spellCheck=");
  html = html.replace(/\sspellcheck=/g, " spellCheck=");
  html = html.replace(/\tfetchpriority=/g, " fetchPriority=");
  html = html.replace(/\sfetchpriority=/g, " fetchPriority=");
  html = html.replace(/\tmaxlength=/g, " maxLength=");
  html = html.replace(/\smaxlength=/g, " maxLength=");
  html = html.replace(/\treadonly=/g, " readOnly=");
  html = html.replace(/\sreadonly=/g, " readOnly=");
  html = html.replace(/\tnovalidate=/g, " noValidate=");
  html = html.replace(/\snovalidate=/g, " noValidate=");
  html = html.replace(/\tcrossorigin=/g, " crossOrigin=");
  html = html.replace(/\scrossorigin=/g, " crossOrigin=");
  html = html.replace(/\tdatetime=/g, " dateTime=");
  html = html.replace(/\sdatetime=/g, " dateTime=");
  html = html.replace(/\trowspan=/g, " rowSpan=");
  html = html.replace(/\srowspan=/g, " rowSpan=");
  html = html.replace(/\tchecked=/g, " defaultChecked=");
  html = html.replace(/\schecked=/g, " defaultChecked=");
  html = html.replace(/\schecked(?=[\s>])/g, " defaultChecked");
  html = html.replace(/\tonsubmit="return false"/g, ' onSubmit={(e) => e.preventDefault()}');

  html = html.replace(/\shref="([^"]*)"/g, (_, h) => ` href="${rewriteHref(h)}"`);
  html = html.replace(/\ssrc="([^"]*)"/g, (_, s) => {
    if (s.startsWith("assets/")) return ` src="/${s}"`;
    return ` src="${s}"`;
  });

  html = html.replace(/\sstyle="([^"]*)"/g, (_, s) => ` style=${cssToJsx(s)}`);

  html = html.replace(/\s(tabIndex|colSpan|rowSpan|width|height|rows|cols|maxLength|min|max|step|span)="(\d+)"/g, " $1={$2}");

  html = html.replace(/\sdefaultChecked="[^"]*"/g, " defaultChecked");

  return html.trim();
}

function extract(html) {
  const title = (html.match(/<title>([^<]+)<\/title>/) || [, ""])[1]
    .replace(/\s*\|\s*Garth Heckman.*$/, "")
    .replace(/&amp;/g, "&");
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1];
  const robots = /<meta name="robots" content="noindex">/.test(html);
  const main = (html.match(/<main id="main">([\s\S]*?)<\/main>/) || [, ""])[1];
  return { title, desc, robots, main };
}

for (const p of PAGES) {
  const html = fs.readFileSync(path.join(proto, p.file), "utf8");
  const { title, desc, robots, main } = extract(html);
  const jsx = htmlToJsx(main);
  const dir = path.join(app, p.route);
  fs.mkdirSync(dir, { recursive: true });

  const metaBits = [
    `  title: ${JSON.stringify(title)},`,
    desc ? `  description: ${JSON.stringify(desc)},` : "",
    robots ? `  robots: { index: false, follow: false },` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const out = `import type { Metadata } from "next";
import { SiteChrome } from "@/components/chrome/SiteChrome";

export const metadata: Metadata = {
${metaBits}
};

export default function Page() {
  return (
    <SiteChrome nav=${JSON.stringify(p.nav)}>
      <main id="main">
${jsx.split("\n").map((l) => (l ? "        " + l : "")).join("\n")}
      </main>
    </SiteChrome>
  );
}
`;
  fs.writeFileSync(path.join(dir, "page.tsx"), out);
  console.log("wrote", p.route, "page.tsx", out.length);
}
