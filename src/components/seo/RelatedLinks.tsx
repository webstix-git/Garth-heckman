type RelatedLink = { href: string; label: string; note?: string };

/** Lightweight internal-linking block used on key marketing pages. */
export function RelatedLinks({
  title = "Keep exploring",
  links,
}: {
  title?: string;
  links: RelatedLink[];
}) {
  if (!links.length) return null;
  return (
    <section className="sec tint" aria-label={title}>
      <div className="wrap">
        <p className="meta meta--gold">{title}</p>
        <div className="grid g3 hair mt4" data-rv data-stagger>
          {links.map((link) => (
            <a key={link.href} className="card card--link" href={link.href}>
              <h3 className="card__t">{link.label}</h3>
              {link.note ? <p className="card__d">{link.note}</p> : null}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
