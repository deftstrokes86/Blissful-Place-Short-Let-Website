import Image from "next/image";
import Link from "next/link";

import { buildBookingHref } from "@/lib/booking-flat-preselection";

export function HomeFeaturedResidencesSection() {
  return (
    <section id="residences" className="section container text-center">
      <span className="subtitle-tag">OUR RESIDENCES</span>
      <h2 className="heading-lg serif">Featured Residences</h2>

      <div className="residence-grid text-left">
        <div className="residence-card">
          <div className="residence-img">
            <span className="residence-tag">3BR · 3BA · 6 GUESTS</span>
            <Image src="/downstairs-sitting-room-landscape-1.png" alt="Windsor Residence" fill style={{ objectFit: "cover" }} />
          </div>
          <div className="residence-content">
            <Link href="/property" style={{ color: "inherit", textDecoration: "none" }} className="hover-primary">
              <h3 className="heading-sm serif">Windsor Residence</h3>
            </Link>
            <p>Warm, restful interiors with silent solar power and fiber internet. Ideal for unwinding after a long journey.</p>
            <Link href={buildBookingHref("windsor")} className="btn btn-primary btn-full" style={{ display: "block", textAlign: "center", boxSizing: "border-box" }}>
              Book Now
            </Link>
          </div>
        </div>

        <div className="residence-card">
          <div className="residence-img">
            <span className="residence-tag">3BR · 3BA · 6 GUESTS</span>
            <Image src="/living-room-bungalow-portrait-1.png" alt="Kensington Lodge" fill style={{ objectFit: "cover" }} />
          </div>
          <div className="residence-content">
            <Link href="/property" style={{ color: "inherit", textDecoration: "none" }} className="hover-primary">
              <h3 className="heading-sm serif">Kensington Lodge</h3>
            </Link>
            <p>Clean, orderly layout suited for focused remote work and quiet extended stays.</p>
            <Link href={buildBookingHref("kensington")} className="btn btn-primary btn-full" style={{ display: "block", textAlign: "center", boxSizing: "border-box" }}>
              Book Now
            </Link>
          </div>
        </div>

        <div className="residence-card">
          <div className="residence-img">
            <span className="residence-tag">3BR · 3BA · 6 GUESTS</span>
            <Image src="/living-room-upstairs-portrait-1.png" alt="Mayfair Suite" fill style={{ objectFit: "cover" }} />
          </div>
          <div className="residence-content">
            <Link href="/property" style={{ color: "inherit", textDecoration: "none" }} className="hover-primary">
              <h3 className="heading-sm serif">Mayfair Suite</h3>
            </Link>
            <p>Bold finishing touches for guests who appreciate a space with personality and character.</p>
            <Link href={buildBookingHref("mayfair")} className="btn btn-primary btn-full" style={{ display: "block", textAlign: "center", boxSizing: "border-box" }}>
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
