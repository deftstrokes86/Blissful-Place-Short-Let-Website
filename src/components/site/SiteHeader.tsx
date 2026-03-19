"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/common/BrandLogo";
import { Menu, X } from "@/lib/lucide-react";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-config";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/property", label: "Flats" },
  { href: "/book", label: "Booking" },
  { href: "/#promise", label: "About" },
  { href: "/#residences", label: "Location" },
  { href: "/guide", label: "Guest Guide" },
  { href: "/availability", label: "Availability" },
  { href: "/tour", label: "Private Tour" },
  { href: "/#contact", label: "Contact" },
];

interface SiteHeaderProps {
  promoText?: string;
}

export function SiteHeader({
  promoText = "BOOK DIRECT: 15% OFF YOUR STAY, PRIORITY LATE CHECK-OUT & COMPLIMENTARY WELCOME PERKS",
}: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        style={{
          background: "var(--primary)",
          color: "white",
          textAlign: "center",
          padding: "0.6rem 1rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          textTransform: "uppercase",
        }}
      >
        {promoText}
      </div>

      <nav
        className={`navbar ${isScrolled ? "sticky" : ""}`}
        style={
          !isScrolled
            ? { top: "38px", transition: "all 0.3s ease" }
            : { transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }
        }
      >
        <div className="logo" style={{ marginTop: "-0.3rem" }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center" }}>
            <BrandLogo variant="nav" />
          </Link>
        </div>

        <div className="nav-links hide-on-mobile">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
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
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
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
