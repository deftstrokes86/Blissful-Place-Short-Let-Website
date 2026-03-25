import Image from "next/image";
import Link from "next/link";

import { buildBookingHref } from "@/lib/booking-flat-preselection";

export function HomeFeaturedResidencesSection() {
  return (
    <section id="residences" className="section container text-center">
      <span className="subtitle-tag">CURATED LIVING</span>
      <h2 className="heading-lg serif">Featured Residences</h2>

      <div className="residence-grid text-left">
        <div className="residence-card">
          <div className="residence-img">
            <span className="residence-tag">PREMIUM</span>
            <Image src="/windsor.png" alt="Windsor Residence" fill style={{ objectFit: "cover" }} />
          </div>
          <div className="residence-content">
            <Link href="/property" style={{ color: "inherit", textDecoration: "none" }} className="hover-primary">
              <h3 className="heading-sm serif">Windsor Residence</h3>
            </Link>
            <p>A masterpiece of classic elegance combined with cutting-edge smart home technology.</p>
            <Link href={buildBookingHref("windsor")} className="btn btn-primary btn-full" style={{ display: "block", textAlign: "center", boxSizing: "border-box" }}>
              Book Now
            </Link>
          </div>
        </div>

        <div className="residence-card">
          <div className="residence-img">
            <span className="residence-tag">EXCLUSIVE</span>
            <Image src="/kensington.png" alt="Kensington Lodge" fill style={{ objectFit: "cover" }} />
          </div>
          <div className="residence-content">
            <Link href="/property" style={{ color: "inherit", textDecoration: "none" }} className="hover-primary">
              <h3 className="heading-sm serif">Kensington Lodge</h3>
            </Link>
            <p>A sanctuary of peace and prestige, featuring private terraces and bespoke designer finishes.</p>
            <Link href={buildBookingHref("kensington")} className="btn btn-primary btn-full" style={{ display: "block", textAlign: "center", boxSizing: "border-box" }}>
              Book Now
            </Link>
          </div>
        </div>

        <div className="residence-card">
          <div className="residence-img">
            <span className="residence-tag">PENTHOUSE</span>
            <Image src="/mayfair.png" alt="Mayfair Suite" fill style={{ objectFit: "cover" }} />
          </div>
          <div className="residence-content">
            <Link href="/property" style={{ color: "inherit", textDecoration: "none" }} className="hover-primary">
              <h3 className="heading-sm serif">Mayfair Suite</h3>
            </Link>
            <p>The pinnacle of luxury living with 360-degree panoramic city views and 24-hour private service.</p>
            <Link href={buildBookingHref("mayfair")} className="btn btn-primary btn-full" style={{ display: "block", textAlign: "center", boxSizing: "border-box" }}>
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
