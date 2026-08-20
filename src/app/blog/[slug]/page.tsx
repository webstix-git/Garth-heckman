import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { Shot } from "@/components/Shot";
import { BLOG_POSTS, getPost, otherPosts } from "@/lib/blog";
import { articleBody } from "@/components/blog/ArticleBodies";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Blog" };
  return { title: post.t, description: post.lede };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const more = otherPosts(slug);
  const body = articleBody(slug);

  return (
    <SiteChrome nav="blog">
      <main id="main">
        <article>
          <header className="phead on-dark grain">
            <div className="wrap-t" style={{ position: "relative", zIndex: 2 }}>
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
                {post.h1[0]}
                <br />
                {post.h1[1]}
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

          <div className="wrap-t" style={{ marginTop: "clamp(-48px,-2.4vw,-24px)", position: "relative", zIndex: 5 }}>
            <Shot variant={post.v} ratio="16-9" label={false} alt={post.imgAlt} src={post.img} />
          </div>

          <div className="sec tint" style={{ marginTop: 0 }}>
            <div className="wrap-t prose">
              <div className="tldr">
                <p className="tldr__h">TL;DR</p>
                <p className="tldr__l">{post.tldr}</p>
              </div>
              {body}
            </div>

            <div className="wrap-t mt6">
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
