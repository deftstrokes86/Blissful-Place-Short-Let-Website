"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  promoText = "BOOK DIRECT: 15% OFF YOUR STAY, PRIORITY LATE CHECK-OUT & COMPLIMENTARY WELCOME PERKS",
}: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [promoHeight, setPromoHeight] = useState(38);
  const promoBarRef = useRef<HTMLDivElement | null>(null);

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

        <div className="nav-links hide-on-mobile">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.href} className="nav-item-with-menu">
                <Link href={item.href} className="nav-parent-link">
                  {item.label}
                </Link>
                <ChevronDown size={14} className="nav-dropdown-icon" aria-hidden />
                <div className="nav-submenu" role="menu" aria-label={`${item.label} submenu`}>
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href} role="menuitem">
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            )
          )}
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

