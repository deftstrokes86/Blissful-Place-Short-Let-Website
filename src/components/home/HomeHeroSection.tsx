"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Calendar, User } from "@/lib/lucide-react";
import { buildBookingHref } from "@/lib/booking-flat-preselection";
import { SITE_LOCATION_LABEL } from "@/lib/site-config";

export function HomeHeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const heroImageLayerRef = useRef<HTMLDivElement>(null);
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let rafId: number;

    function onScroll() {
      rafId = requestAnimationFrame(() => {
        if (heroImageLayerRef.current) {
          const offset = window.scrollY * 0.35;
          heroImageLayerRef.current.style.setProperty("--hero-image-position-y", `calc(50% + ${offset}px)`);
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  function openPicker(ref: React.RefObject<HTMLInputElement | null>) {
    try {
      ref.current?.showPicker?.();
    } catch {
      ref.current?.focus();
    }
  }

  // Prevent default label→focus behaviour and open picker explicitly
  function handleCheckInLabelClick(e: React.MouseEvent<HTMLLabelElement>) {
    e.preventDefault();
    openPicker(checkInRef);
  }

  function handleCheckOutLabelClick(e: React.MouseEvent<HTMLLabelElement>) {
    e.preventDefault();
    openPicker(checkOutRef);
  }

  // Called synchronously in onChange — still within user activation window
  function handleCheckInChange() {
    openPicker(checkOutRef);
  }

  return (
    <section ref={heroRef} className="hero">
      <div
        ref={heroImageLayerRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
      >
        <Image
          src="/Hero-Image.webp"
          alt="Luxury short-let apartment interior at Blissful Place Residences in Agbado, Lagos"
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center var(--hero-image-position-y, 50%)",
          }}
        />
      </div>
      <div className="container hero-content">
        <div className="hero-meta-strip">
          <span className="subtitle-tag" style={{ margin: 0 }}>
            PREMIUM SHORT-LET RESIDENCES
          </span>
          <span className="subtitle-tag hero-meta-separator" style={{ margin: 0 }}>
            /
          </span>
          <span className="subtitle-tag" style={{ margin: 0 }}>
            {SITE_LOCATION_LABEL.toUpperCase()}
          </span>
        </div>
        <h1 className="heading-xl">
          <span className="serif">Your Private Residence.</span>
          <br />
          <span className="serif text-primary">Silent Power. Real Comfort.</span>
        </h1>
        <p className="hero-desc" style={{ fontSize: "1.25rem", color: "#fff" }}>
          Three professionally managed apartments in a secure gated compound in Agbado, Lagos, with practical mainland access toward Ikeja, Abule Egba, Meiran, and Egbeda. Full solar power, fiber internet, and direct booking with no middleman fees.
        </p>

        <div className="booking-bar">
          {/* Check-in */}
          <label className="booking-field" htmlFor="hero-checkin" onClick={handleCheckInLabelClick}>
            <Calendar className="booking-icon" size={20} />
            <div className="booking-input-group">
              <span className="booking-label">CHECK-IN</span>
              <input
                ref={checkInRef}
                id="hero-checkin"
                type="date"
                className="date-input"
                aria-label="Check-in date"
                onChange={handleCheckInChange}
                onClick={(e) => { e.stopPropagation(); openPicker(checkInRef); }}
              />
            </div>
          </label>

          {/* Check-out */}
          <label className="booking-field" htmlFor="hero-checkout" onClick={handleCheckOutLabelClick}>
            <Calendar className="booking-icon" size={20} />
            <div className="booking-input-group">
              <span className="booking-label">CHECK-OUT</span>
              <input
                ref={checkOutRef}
                id="hero-checkout"
                type="date"
                className="date-input"
                aria-label="Check-out date"
                onClick={(e) => { e.stopPropagation(); openPicker(checkOutRef); }}
              />
            </div>
          </label>

          {/* Guests */}
          <label className="booking-field" htmlFor="hero-guests">
            <User className="booking-icon" size={20} />
            <div className="booking-input-group">
              <span className="booking-label">GUESTS</span>
              <select id="hero-guests" className="guest-select" aria-label="Select Guests">
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5 Guests</option>
                <option value="6">6 Guests</option>
              </select>
            </div>
          </label>

          <Link href={buildBookingHref()} className="btn btn-primary booking-cta" style={{ padding: "1.25rem 2rem" }}>
            Check Availability
          </Link>
        </div>
      </div>
    </section>
  );
}
