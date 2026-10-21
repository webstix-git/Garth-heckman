import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";
import {
  getPublishedPost,
  otherPublishedPosts,
} from "@/lib/blog-public";
import { fetchStoreSettings } from "@/lib/settings-supabase";
import { robotsMetadata } from "@/lib/seo-robots";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [post, { settings }] = await Promise.all([
    getPublishedPost(slug),
    fetchStoreSettings(),
  ]);
  if (!post) return { title: "Blog" };
  return {
    title: post.seo?.title || post.t,
    description: post.seo?.description || post.lede,
    robots: robotsMetadata({
      globalNoindex: settings.seo?.noindex,
      noindex: post.seo?.noindex,
      nofollow: post.seo?.nofollow,
    }),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  const more = await otherPublishedPosts(slug);

  return (
    <SiteChrome nav="blog">
      <main id="main">
        <article>
          <header className="phead on-dark grain">
            <div className="wrap-t wrap-t--post" style={{ position: "relative", zIndex: 2 }}>
              <nav className="crumbs meta mb4" aria-label="Breadcrumb">
                <a href="/">Home</a>
                <s>/</s>
                <a href="/blog">Blog</a>
                <s>/</s>
                <span>{post.t}</span>
              </nav>
              <p className="meta meta--gold">
                Article · {post.read} read · {post.dateLong}
              </p>
              <h1 className="d1 mt3" style={{ fontSize: "clamp(2.4rem,6vw,5rem)" }}>
                {post.h1[1] ? (
                  <>
                    {post.h1[0]}
                    <br />
                    {post.h1[1]}
                  </>
                ) : (
                  post.h1[0] || post.t
                )}
              </h1>
              <p className="lede mt5 dim">{post.lede}</p>
              <div className="between mt5" style={{ paddingTop: "22px", borderTop: "1px solid var(--line)", gap: "24px" }}>
                <div className="byline">
                  <span className="byline__av">
                    <img src="/assets/img/gh-logo.png" width={732} height={732} alt="" />
                  </span>
                  <span>
                    <b>Garth Heckman</b>
                    <span className="meta meta--dim">Coach, pastor, author</span>
                  </span>
                </div>
                <div className="row" style={{ gap: "8px" }}>
                  {post.badges.map((b) => (
                    <span className="badge" key={b}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="wrap-t wrap-t--post" style={{ marginTop: "clamp(-48px,-2.4vw,-24px)", position: "relative", zIndex: 5 }}>
            <Shot variant={post.v} ratio="16-9" label={false} alt={post.imgAlt} src={post.img || undefined} />
          </div>

          <div className="sec tint" style={{ marginTop: 0 }}>
            <div className="wrap-t wrap-t--post prose">
              <div className="tldr">
                <p className="tldr__h">TL;DR</p>
                <p className="tldr__l">{post.tldr}</p>
              </div>
              {post.content ? (
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : null}
            </div>

            <div className="wrap-t wrap-t--post mt6">
              <div className="card">
                <div className="between">
                  <div>
                    <p className="meta meta--gold">{post.cta.kicker}</p>
                    <p className="d4 mt2">{post.cta.t}</p>
                    <p className="body sm mt1">{post.cta.d}</p>
                  </div>
                  <a className="btn" href={post.cta.href}>
                    {post.cta.btn}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <section className="sec">
            <div className="wrap">
              <div className="between mb5">
                <h2 className="d3">More from the blog</h2>
                <a className="tlink" href="/blog">
                  All posts
                </a>
              </div>
              <div className="ep-grid">
                {more.map((p) => (
                  <article className="ep" key={p.slug}>
                    <div className="ep__top">
                      <span className="ep__no"></span>
                      <span className="meta meta--dim tnum">{p.read}</span>
                    </div>
                    <h3 className="ep__title">{p.t}</h3>
                    <p className="body sm">{p.d}</p>
                    <div className="ep__foot">
                      <span className="meta meta--dim">
                        Article · {p.date}
                      </span>
                      <span className="ep__play"></span>
                    </div>
                    <a className="ep__link" href={`/blog/${p.slug}`} aria-label={p.t}></a>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </article>
      </main>
    </SiteChrome>
  );
}
