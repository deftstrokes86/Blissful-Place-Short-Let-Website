import Link from "next/link";

export type HelpfulLink = {
  href: string;
  label: string;
  description?: string;
};

type HelpfulLinksProps = {
  title?: string;
  links: HelpfulLink[];
};

export function HelpfulLinks({
  title = "Helpful links",
  links,
}: HelpfulLinksProps) {
  return (
    <section
      className="booking-section"
      aria-labelledby="helpful-links-heading"
    >
      <h2
        id="helpful-links-heading"
        className="heading-sm serif"
        style={{ marginBottom: "1rem" }}
      >
        {title}
      </h2>
      <div className="blog-empty-actions">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="btn btn-outline-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
