import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";
import { getCustomPost, listCustomPosts } from "@/lib/custom-posts-server";
import { SHORTS_POST_TYPE, formatPostDate, postView, type PostView } from "@/lib/custom-posts";
import { fetchStoreSettings } from "@/lib/settings-supabase";
import { dynamicPageSeo, pageSeo } from "@/lib/seo";
import { mailtoHref, telHref } from "@/lib/links";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [found, site] = await Promise.all([getCustomPost(SHORTS_POST_TYPE, slug), fetchStoreSettings().catch(() => null)]);
  if (!found) return pageSeo("/shorts");
  const view = postView(found.post);
  return dynamicPageSeo({
    path: `/shorts/${view.slug}`,
    title: view.title,
    description: view.description,
    image: view.image,
    globalNoindex: site?.settings.seo?.noindex,
  });
}

function Extra({ item }: { item: PostView["extras"][number] }) {
  const value = item.value;
  if (item.type === "url" && typeof value === "string") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer">
        {value.replace(/^https?:\/\//, "")}
      </a>
    );
  }
  if (item.type === "file" && value && typeof value === "object" && "url" in value) {
    const file = value as { url: string; name?: string };
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" download>
        {file.name || "Download"}
      </a>
    );
  }
  if (item.type === "email" && typeof value === "string") return <a href={mailtoHref(value)}>{value}</a>;
  if (item.type === "phone" && typeof value === "string") return <a href={telHref(value)}>{value}</a>;
  if (item.type === "checkbox") return <>{value ? "Yes" : "No"}</>;
  if (item.type === "date" || item.type === "datetime") return <>{formatPostDate(String(value), "long")}</>;
  if (Array.isArray(value)) {
    return (
      <>
        {value
          .map((entry) => (entry && typeof entry === "object" && "url" in entry ? null : String(entry)))
          .filter(Boolean)
          .join(", ")}
      </>
    );
  }
  if (value && typeof value === "object" && "url" in value) {
    return (
      <a href={String((value as { url: string }).url)} target="_blank" rel="noopener noreferrer">
        Open
      </a>
    );
  }
  return <>{String(value)}</>;
}

export default async function ShortPage({ params }: Props) {
  const { slug } = await params;
  const found = await getCustomPost(SHORTS_POST_TYPE, slug);
  if (!found) notFound();
  const short = postView(found.post);
  const typeName = found.type.name;
  const more = ((await listCustomPosts(SHORTS_POST_TYPE, { limit: 4 }))?.posts ?? [])
    .map(postView)
    .filter((post) => post.slug !== short.slug)
    .slice(0, 3);
  const embed = short.video?.embedUrl;
  const vertical = short.video?.vertical ?? true;

  return (
    <SiteChrome nav="blog">
      <main id="main">
        <article>
          <header className="phead on-dark grain">
            <div className="wrap-t wrap-t--post" style={{ position: "relative", zIndex: 2 }}>
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a>
                <s>/</s>
                <a href="/shorts">{typeName}</a>
                <s>/</s>
                <span>{short.title}</span>
              </nav>
              <p className="meta meta--gold">
                {short.category || found.type.singularName}
                {short.date ? ` · ${formatPostDate(short.date, "long")}` : ""}
              </p>
              <h1 className="d1 mt3" style={{ fontSize: "clamp(2.4rem,6vw,5rem)" }}>
                {short.title}
              </h1>
            </div>
          </header>

          <div className="wrap-t wrap-t--post" style={{ marginTop: "clamp(-48px,-2.4vw,-24px)", position: "relative", zIndex: 5 }}>
            {embed ? (
              <div
                style={{
                  position: "relative",
                  aspectRatio: vertical ? "9 / 16" : "16 / 9",
                  maxWidth: vertical ? 420 : "100%",
                  margin: "0 auto",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#000",
                }}
              >
                <iframe
                  src={embed}
                  title={short.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
            ) : (
              <Shot variant="warm" ratio="16-9" label={false} alt={short.imageAlt} src={short.image || undefined} />
            )}
          </div>

          <div className="sec tint" style={{ marginTop: 0 }}>
            <div className="wrap-t wrap-t--post prose">
              {short.description ? (
                <div className="tldr">
                  <p className="tldr__h">TL;DR</p>
                  <p className="tldr__l">{short.description}</p>
                </div>
              ) : null}
              {short.html ? <div dangerouslySetInnerHTML={{ __html: short.html }} /> : null}
              {short.extras.length ? (
                <dl className="mt5">
                  {short.extras.map((item) => (
                    <div key={item.key} className="mt3">
                      <dt className="meta meta--dim">{item.label}</dt>
                      <dd style={{ margin: 0 }}>
                        <Extra item={item} />
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {short.video?.url ? (
                <p className="mt5">
                  <a className="btn btn--line" href={short.video.url} target="_blank" rel="noopener noreferrer">
                    {short.video.provider === "youtube" ? "Open on YouTube" : "Watch the video"}
                  </a>
                </p>
              ) : null}
            </div>
          </div>

          {more.length ? (
            <section className="sec">
              <div className="wrap">
                <div className="between mb5">
                  <h2 className="d3">More {typeName}</h2>
                  <a className="tlink" href="/shorts">
                    All {typeName}
                  </a>
                </div>
                <div className="ep-grid">
                  {more.map((p) => (
                    <article className="ep" key={p.slug}>
                      <div className="ep__top">
                        <span className="ep__no"></span>
                        <span className="meta meta--dim tnum">{formatPostDate(p.date)}</span>
                      </div>
                      <h3 className="ep__title">{p.title}</h3>
                      <p className="body sm">{p.description}</p>
                      <div className="ep__foot">
                        <span className="meta meta--dim">{p.category || found.type.singularName}</span>
                        <span className="ep__play"></span>
                      </div>
                      <a className="ep__link" href={`/shorts/${p.slug}`} aria-label={p.title}></a>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </article>
      </main>
    </SiteChrome>
  );
}
