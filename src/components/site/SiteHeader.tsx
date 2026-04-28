"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { BrandLogo } from "@/components/common/BrandLogo";
import { ChevronDown, Menu, X } from "@/lib/lucide-react";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-config";

interface NavChildItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  children?: readonly NavChildItem[];
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/property", label: "Flats" },
  {
    href: "/book",
    label: "Booking",
    children: [
      { href: "/availability", label: "Availability" },
      { href: "/tour", label: "Private Tour" },
    ],
  },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/guide", label: "Guest Guide" },
  { href: "/contact", label: "Contact" },
];

interface SiteHeaderProps {
  promoText?: string;
}

export function SiteHeader({
  promoText = "BOOK DIRECT: 15% OFF ELIGIBLE STAYS, PRIORITY LATE CHECK-OUT & COMPLIMENTARY WELCOME PERKS",
}: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [promoHeight, setPromoHeight] = useState(38);
  const promoBarRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const isActive = (item: NavItem): boolean => {
    if (item.href === "/") return pathname === "/";
    if (item.children) {
      return (
        pathname.startsWith("/book") ||
        pathname.startsWith("/availability") ||
        pathname.startsWith("/tour")
      );
    }
    return pathname === item.href;
  };

  const activeHref = NAV_ITEMS.find(isActive)?.href ?? null;
  const pillTarget = hoveredHref ?? activeHref;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const promoBar = promoBarRef.current;

    if (!promoBar) {
      return;
    }

    const updatePromoHeight = () => {
      setPromoHeight(Math.ceil(promoBar.getBoundingClientRect().height));
    };

    updatePromoHeight();
    window.addEventListener("resize", updatePromoHeight);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        window.removeEventListener("resize", updatePromoHeight);
      };
    }

    const observer = new ResizeObserver(() => {
      updatePromoHeight();
    });

    observer.observe(promoBar);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePromoHeight);
    };
  }, [promoText]);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", isMobileMenuOpen);

    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <div ref={promoBarRef} className="site-promo-bar">
        {promoText}
      </div>

      <nav className={`navbar ${isScrolled ? "sticky" : ""}`} style={!isScrolled ? { top: `${promoHeight}px` } : undefined}>
        <div className="logo site-header-logo">
          <Link href="/" style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center" }}>
            <BrandLogo variant="nav" />
          </Link>
        </div>

        <div
          className="nav-links hide-on-mobile nav-pill-track"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const hovered = hoveredHref === item.href;
            const lit = active || hovered;
            const showPill = pillTarget === item.href;

            return item.children ? (
              <div
                key={item.href}
                className="nav-item-with-menu nav-pill-item"
                data-active={active ? "true" : "false"}
                data-hovered={hovered ? "true" : "false"}
                onMouseEnter={() => setHoveredHref(item.href)}
                onFocus={() => setHoveredHref(item.href)}
              >
                {showPill && (
                  <motion.span
                    layoutId="nav-pill"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "9999px",
                      backgroundColor: "rgba(238,29,82,0.14)",
                      border: "1px solid rgba(238,29,82,0.4)",
                      zIndex: 0,
                    }}
                    transition={{ type: "spring", stiffness: 340, damping: 28 }}
                  />
                )}
                <Link
                  href={item.href}
                  className="nav-parent-link"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    color: lit ? "var(--text-primary)" : "var(--text-secondary)",
                    transition: "color 0.2s ease",
                  }}
                >
                  {item.label}
                </Link>
                <ChevronDown
                  size={14}
                  className="nav-dropdown-icon"
                  aria-hidden
                  style={{ position: "relative", zIndex: 1 }}
                />
                <div className="nav-submenu" role="menu" aria-label={`${item.label} submenu`}>
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href} role="menuitem">
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div
                key={item.href}
                className="nav-pill-item"
                data-active={active ? "true" : "false"}
                data-hovered={hovered ? "true" : "false"}
                onMouseEnter={() => setHoveredHref(item.href)}
                onFocus={() => setHoveredHref(item.href)}
              >
                {showPill && (
                  <motion.span
                    layoutId="nav-pill"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "9999px",
                      backgroundColor: "rgba(238,29,82,0.14)",
                      border: "1px solid rgba(238,29,82,0.4)",
                      zIndex: 0,
                    }}
                    transition={{ type: "spring", stiffness: 340, damping: 28 }}
                  />
                )}
                <Link
                  href={item.href}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    color: lit ? "var(--text-primary)" : "var(--text-secondary)",
                    transition: "color 0.2s ease",
                  }}
                >
                  {item.label}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="nav-actions hide-on-mobile">
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-white"
            style={{ padding: "0.6rem 1.25rem", fontSize: "0.8rem" }}
          >
            Make an Inquiry
          </a>
          <Link href="/book" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem", fontSize: "0.8rem" }}>
            Book Now
          </Link>
        </div>

        <button
          className="mobile-menu-btn show-on-mobile"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className={`mobile-nav ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-nav-links">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.href} className="mobile-nav-group">
                  <Link href={item.href} className="mobile-nav-parent" onClick={() => setIsMobileMenuOpen(false)}>
                    {item.label}
                    <ChevronDown size={16} aria-hidden />
                  </Link>
                  <div className="mobile-nav-submenu">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} onClick={() => setIsMobileMenuOpen(false)}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              )
            )}
          </div>
          <div className="mobile-nav-actions">
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-white"
              style={{ display: "flex", justifyContent: "center", padding: "1rem" }}
            >
              Make an Inquiry
            </a>
            <Link
              href="/book"
              className="btn btn-primary"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ display: "flex", justifyContent: "center", padding: "1rem" }}
            >
              Book Now
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
