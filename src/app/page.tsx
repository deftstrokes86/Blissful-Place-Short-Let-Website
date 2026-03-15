"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Calendar, User, Zap, MessageSquare, Shield, BookOpen, Star, Sparkles, MapPin, Plane, Coffee, ChevronDown, CheckCircle2, Wifi, Menu, X, Instagram, Twitter, Linkedin } from "@/lib/lucide-react";

export default function Home() {
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
    <main>
      {/* Global Promo Banner */}
      <div style={{ background: 'var(--primary)', color: 'white', textAlign: 'center', padding: '0.6rem 1rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1001, textTransform: 'uppercase' }}>
        BOOK DIRECT: 15% OFF YOUR STAY, PRIORITY LATE CHECK-OUT & COMPLIMENTARY WELCOME PERKS
      </div>

      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'sticky' : ''}`} style={!isScrolled ? { top: '38px', transition: 'all 0.3s ease' } : { transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="logo" style={{ marginTop: '-0.3rem' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <BrandLogo variant="nav" />
          </Link>
        </div>
        
        {/* Desktop Links */}
        <div className="nav-links hide-on-mobile">
          <Link href="/">Home</Link>
          <Link href="/property">Flats</Link>
          <Link href="/book">Booking</Link>
          <a href="#promise">About</a>
          <a href="#residences">Location</a>
          <Link href="/guide">Guest Guide</Link>
          <a href="#contact">Contact</a>
        </div>
        
        {/* Desktop Actions */}
        <div className="nav-actions hide-on-mobile">
          <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" className="btn btn-outline-white" style={{ padding: '0.6rem 1.25rem', fontSize: '0.8rem' }}>Make an Inquiry</a>
          <Link href="/book" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.8rem' }}>Book Now</Link>
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-menu-btn show-on-mobile" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Dropdown */}
        <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-links">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link href="/property" onClick={() => setIsMobileMenuOpen(false)}>Flats</Link>
            <Link href="/book" onClick={() => setIsMobileMenuOpen(false)}>Booking</Link>
            <a href="#promise" onClick={() => setIsMobileMenuOpen(false)}>About</a>
            <a href="#residences" onClick={() => setIsMobileMenuOpen(false)}>Location</a>
            <Link href="/guide" onClick={() => setIsMobileMenuOpen(false)}>Guest Guide</Link>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
          </div>
          <div className="mobile-nav-actions">
            <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" className="btn btn-outline-white" style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>Make an Inquiry</a>
            <Link href="/book" className="btn btn-primary" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>Book Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: 'url("/hero-opulence.png")' }}>
        <div className="container hero-content">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', opacity: 0.9 }}>
             <span className="subtitle-tag" style={{ margin: 0 }}>★★★★★ 4.9/5 GUEST RATING</span>
             <span className="subtitle-tag" style={{ margin: 0 }}>•</span>
             <span className="subtitle-tag" style={{ margin: 0 }}>IJAIYE, LAGOS</span>
          </div>
          <h1 className="heading-xl">
            <span className="serif">Elevate Your Stay.</span><br />
            <span className="serif text-primary">Uncompromised Luxury.</span>
          </h1>
          <p className="hero-desc" style={{ fontSize: '1.25rem', color: '#fff' }}>
            Experience Lagos’ most refined, secure, and seamlessly managed premium short-let residences. Discerning guests book direct.
          </p>
          
          <div className="booking-bar">
            <div className="booking-field">
              <Calendar className="booking-icon" size={20} />
              <div className="booking-input-group">
                <span className="booking-label">CHECK-IN / OUT</span>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input type="date" className="date-input" aria-label="Check-in date" />
                  <span style={{color: 'var(--text-secondary)'}}>-</span>
                  <input type="date" className="date-input" aria-label="Check-out date" />
                </div>
              </div>
            </div>
            <div className="booking-field">
              <User className="booking-icon" size={20} />
              <div className="booking-input-group">
                <span className="booking-label">GUESTS</span>
                <select className="guest-select" aria-label="Select Guests">
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5 Guests</option>
                  <option value="6">6 Guests</option>
                </select>
              </div>
            </div>
            <Link href="/book" className="btn btn-primary booking-cta" style={{ padding: '1.25rem 2rem' }}>
              Check Availability
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Residences */}
      <section id="residences" className="section container text-center">
        <span className="subtitle-tag">CURATED LIVING</span>
        <h2 className="heading-lg serif">Featured Residences</h2>
        
        <div className="residence-grid text-left">
          {/* Residence 1 - Windsor */}
          <div className="residence-card">
            <div className="residence-img">
              <span className="residence-tag">PREMIUM</span>
              <Image src="/windsor.png" alt="Windsor Residence" fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="residence-content">
              <Link href="/property" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-primary">
                <h3 className="heading-sm serif">Windsor Residence</h3>
              </Link>
              <p>A masterpiece of classic elegance combined with cutting-edge smart home technology.</p>
              <Link href="/book" className="btn btn-primary btn-full" style={{ display: 'block', textAlign: 'center', boxSizing: 'border-box' }}>Book Now</Link>
            </div>
          </div>

          {/* Residence 2 - Kensington */}
          <div className="residence-card">
            <div className="residence-img">
              <span className="residence-tag">EXCLUSIVE</span>
              <Image src="/kensington.png" alt="Kensington Lodge" fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="residence-content">
              <Link href="/property" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-primary">
                 <h3 className="heading-sm serif">Kensington Lodge</h3>
              </Link>
              <p>A sanctuary of peace and prestige, featuring private terraces and bespoke designer finishes.</p>
              <Link href="/book" className="btn btn-primary btn-full" style={{ display: 'block', textAlign: 'center', boxSizing: 'border-box' }}>Book Now</Link>
            </div>
          </div>

          {/* Residence 3 - Mayfair */}
          <div className="residence-card">
            <div className="residence-img">
              <span className="residence-tag">PENTHOUSE</span>
              <Image src="/mayfair.png" alt="Mayfair Suite" fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="residence-content">
              <Link href="/property" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-primary">
                <h3 className="heading-sm serif">Mayfair Suite</h3>
              </Link>
              <p>The pinnacle of luxury living with 360-degree panoramic city views and 24-hour private service.</p>
              <Link href="/book" className="btn btn-primary btn-full" style={{ display: 'block', textAlign: 'center', boxSizing: 'border-box' }}>Book Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Blissful Promise */}
      <section id="promise" className="section promise-section container">
        <div className="promise-content text-left">
          <span className="subtitle-tag">OUR COMMITMENT</span>
          <h2 className="heading-lg serif">The Blissful<br/>Promise</h2>
          <p className="promise-desc">
            We don't just provide a space; we provide an experience defined by uncompromising standards and attention to detail.
          </p>
          
          <div className="promise-features">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="serif">24/7 Guaranteed Power</h4>
                <p>Dual-grid system with seamless automated industrial backup generators. Zero noise, zero downtime.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Wifi size={24} />
              </div>
              <div>
                <h4 className="serif">Enterprise Connectivity</h4>
                <p>Dedicated Starlink and dual-fiber networks ensuring blazing-fast internet for remote work and streaming.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Shield size={24} />
              </div>
              <div>
                <h4 className="serif">Elite Biometric Security</h4>
                <p>Multi-tier fortified estate access, secure parking, and highly trained 24/7 on-site protection.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="promise-image-wrapper">
          <Image 
            src="/promise.png" 
            alt="Luxurious Interior Detail" 
            fill 
            style={{ objectFit: 'cover' }} 
          />
        </div>
      </section>

      {/* The Direct Booking Advantage */}
      <section className="section container text-center">
        <span className="subtitle-tag">WHY BOOK DIRECT</span>
        <h2 className="heading-lg serif">The Smartest Way to Stay</h2>
        <p className="hero-desc" style={{marginBottom: '3rem'}}>Skip the middleman. Booking directly on our official platform guarantees the ultimate Blissful Place experience.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="advantage-card">
            <CheckCircle2 className="text-primary" size={28} />
            <h4 className="serif">Up to 15% Lower Rates</h4>
            <p>Avoid hidden platform fees on Airbnb or Booking.com. You will always find our guaranteed best available rate right here.</p>
          </div>
          <div className="advantage-card">
            <MessageSquare className="text-primary" size={28} />
            <h4 className="serif">Instant WhatsApp Concierge</h4>
            <p>Get a direct, priority line to our on-ground hospitality team for immediate assistance, 24 hours a day.</p>
          </div>
          <div className="advantage-card">
            <Sparkles className="text-primary" size={28} />
            <h4 className="serif">Early Check-in Priority</h4>
            <p>Direct bookings automatically get placed at the top of the list for complimentary early arrivals and late departures.</p>
          </div>
          <div className="advantage-card">
            <Star className="text-primary" size={28} />
            <h4 className="serif">Welcome & Loyalty Perks</h4>
            <p>Enjoy complimentary premium coffee, dedicated secure parking, and exclusive discounts for your future Lagos visits.</p>
          </div>
        </div>

        {/* Direct vs Platform Comparison */}
        <div className="comparison-table" style={{ marginTop: '5rem', background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <h3 className="heading-sm serif text-center" style={{ marginBottom: '3rem', fontSize: '1.75rem' }}>The True Cost of Third-Party Booking</h3>
          <div className="comparison-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 1.5fr 1.5fr', gap: '1.5rem', textAlign: 'left', alignItems: 'center' }}>
            {/* Labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', paddingTop: '3.5rem' }}>
              <span style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>Booking Fees</span>
              <span style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>Customer Support</span>
              <span style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>Check-in / Out</span>
              <span>Loyalty Rewards</span>
            </div>
            
            {/* Platforms */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontWeight: 700, marginBottom: '2rem', color: 'var(--text-secondary)', textAlign: 'center', letterSpacing: '0.05em' }}>AIRBNB / BOOKING.COM</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)' }}>
                <span style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>Up to 15% Extra (Hidden Fees)</span>
                <span style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>Platform Ticketing System</span>
                <span style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>Strict Standard Times</span>
                <span>None</span>
              </div>
            </div>

            {/* Direct Booking */}
            <div style={{ border: '1px solid var(--primary)', background: 'rgba(238,29,82,0.05)', padding: '2.5rem 2rem', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 30px rgba(238,29,82,0.1)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '0.25rem 1rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>MOST REWARDING</div>
              <div style={{ fontWeight: 700, marginBottom: '2rem', color: 'var(--primary)', textAlign: 'center', letterSpacing: '0.05em' }}>BLISSFUL DIRECT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontWeight: 600, color: 'white' }}>
                <span style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>0% Hidden Fees (Best Rate Guarenteed)</span>
                <span style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>Instant Priority WhatsApp Concierge</span>
                <span style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>Priority Early / Late Access</span>
                <span>15% Off Your Next Stay + Upgrades</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loyalty & Lead Capture */}
      <section className="section bg-light-panel" style={{ paddingBottom: '2rem' }}>
        <div className="container">
          <div className="vip-section-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'center', background: 'var(--bg-dark)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '4rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div>
              <span className="subtitle-tag">VIP GUEST PROGRAM</span>
              <h2 className="heading-lg serif">Unlock the Inner Circle</h2>
              <p className="hero-desc" style={{ marginLeft: 0, textAlign: 'left', marginTop: '1.5rem', maxWidth: '100%', color: 'var(--text-secondary)' }}>
                Join our exclusive guest list and instantly receive a promo code for <strong>10% off your first direct booking</strong>. Returning guests unlock our Blissful Black tier, gaining complimentary upgrades, 15% off subsequent stays, and private chef access.
              </p>
              
              <div className="lead-capture-form" style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                <input type="email" placeholder="Enter your email for instant VIP access..." style={{ flex: 1, padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-panel)', color: 'white', outline: 'none', fontSize: '1rem', fontFamily: 'inherit' }} />
                <button className="btn btn-primary" style={{ padding: '0 2.5rem' }}>Unlock Access</button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem', opacity: 0.7 }}>No spam. Just exclusive luxury offers and priority booking windows for peak seasons in Lagos.</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(22,21,23,0.8) 0%, rgba(10,10,11,1) 100%)', height: '320px', width: '100%', maxWidth: '380px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #d4af37, #f3e5ab, #d4af37)' }}></div>
                 <Sparkles size={48} className="text-secondary" style={{ marginBottom: '1.5rem' }} />
                 <h3 className="serif heading-sm" style={{ letterSpacing: '0.1em' }}>BLISSFUL BLACK</h3>
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Member Card</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upsells & Add-ons */}
      <section className="section bg-light-panel">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span className="subtitle-tag">TAILORED EXPERIENCES</span>
            <h2 className="heading-lg serif">Curated Add-ons</h2>
            <p className="hero-desc">Elevate your stay with our bespoke hospitality services, seamlessly arranged prior to your arrival.</p>
          </div>
          
          <div className="addon-grid">
            <div className="addon-card">
              <Plane className="text-primary" size={32} />
              <div>
                <h4 className="serif" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Premium Airport Transfer</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chauffeur-driven executive pickup from MMA directly to your residence. Avoid the hassle of negotiating taxis.</p>
              </div>
            </div>
            <div className="addon-card">
              <Coffee className="text-primary" size={32} />
              <div>
                <h4 className="serif" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Pantry Pre-Stocking</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Arrive to a fully stocked fridge with your preferred groceries, premium coffee, snacks, and beverages.</p>
              </div>
            </div>
            <div className="addon-card">
              <Sparkles className="text-primary" size={32} />
              <div>
                <h4 className="serif" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Celebration Setup</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Custom decor, roses, champagne, and curated lighting settings to celebrate birthdays or anniversaries.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhood / Experience */}
      <section className="section container neighborhood-split">
        <div className="promise-image-wrapper" style={{ height: '500px' }}>
          <Image src="/hero-opulence.png" alt="Lagos Skyline" fill style={{ objectFit: 'cover' }} />
        </div>
        <div>
          <span className="subtitle-tag">PRIME LOCATIONS</span>
          <h2 className="heading-lg serif">Positioned for Prestige</h2>
          <p className="promise-desc" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            Our residences are strictly embedded within the safest, high-value corridors of Ijaiye, Lagos. 
            You are never more than a 10-minute drive from your next important meeting or exclusive reservation.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <MapPin className="text-primary" size={24} />
              <div>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Seamless access to key business districts and corporate HQs. Less time in traffic, more time executing.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Coffee className="text-primary" size={24} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem' }}>Elite Lifestyle Corridors</strong>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Steps away from Lagos' premier award-winning culinary scene, high-end shopping, and private lounges.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-light-panel text-center">
        <div className="container">
          <span className="subtitle-tag">VERIFIED EXCELLENCE</span>
          <h2 className="heading-lg serif" style={{ marginBottom: '4rem' }}>Don't Just Take Our Word For It</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>
            <div className="testimonial-card">
              <div className="stars">
                <Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} />
              </div>
              <p className="testimonial-text">"As a returning diaspora Nigerian, power and security are non-negotiable. Blissful Place delivered flawlessly. Zero generator noise, perfectly stable Starlink, and the aesthetics are stunning. I book direct every time I fly in now."</p>
              <div className="testimonial-author">Dr. Chuka O.</div>
              <div className="testimonial-type">Diaspora Executive • 2 Week Stay</div>
            </div>
            <div className="testimonial-card">
              <div className="stars">
                <Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} />
              </div>
              <p className="testimonial-text">"The smartest booking decision we made for our team. The space was pristine, quiet, and highly corporate-friendly. The concierge arranging our airport pickup directly to the door at 2 AM was 5-star standard."</p>
              <div className="testimonial-author">Sarah & Mark T.</div>
              <div className="testimonial-type">Corporate Team • 1 Month Stay</div>
            </div>
            <div className="testimonial-card">
              <div className="stars">
                <Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} /><Star fill="currentColor" size={16} />
              </div>
              <p className="testimonial-text">"The biometric security and 24/7 staff presence made me feel completely at ease traveling alone. The team is invisible when you want peace, but instantly responsive on WhatsApp when needed."</p>
              <div className="testimonial-author">Amina B.</div>
              <div className="testimonial-type">Solo Premium Traveler • 5 Night Stay</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery / Glimpse */}
      <section id="gallery" className="gallery-section container">
        <div className="gallery-title-wrapper">
          <h2 className="heading-lg serif">A Glimpse of Grandeur</h2>
          <div className="gallery-line"></div>
        </div>
        
        <div className="gallery-grid">
           {/* Reusing existing generated images as gallery placeholders */}
          <div className="gallery-item"><Image src="/windsor.png" alt="Gallery 1" fill /></div>
          <div className="gallery-item"><Image src="/mayfair.png" alt="Gallery 2" fill /></div>
          <div className="gallery-item"><Image src="/promise.png" alt="Gallery 3" fill /></div>
          <div className="gallery-item"><Image src="/kensington.png" alt="Gallery 4" fill /></div>
          <div className="gallery-item"><Image src="/hero-opulence.png" alt="Gallery 5" fill /></div>
          <div className="gallery-item"><Image src="/pool.png" alt="Gallery 6" fill /></div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span className="subtitle-tag">COMMON INQUIRIES</span>
          <h2 className="heading-lg serif">Frequently Asked Questions</h2>
        </div>
        
        <div className="faq-container">
          <details className="faq-item">
            <summary className="serif">How reliable is the power and internet in your properties? <ChevronDown size={20} className="text-primary" /></summary>
            <p>We guarantee 24/7 uninterrupted power through a dual-grid system with industrial backup generators. Our internet is powered by dedicated Starlink and fiber optics setups, making it perfectly suited for remote work and heavy streaming.</p>
          </details>
          <details className="faq-item">
            <summary className="serif">Are the photos a true representation of the properties? <ChevronDown size={20} className="text-primary" /></summary>
            <p>Absolutely. We operate a strict authenticity policy. What you see is exactly what you get. We manage all properties exclusively to ensure they are maintained to the exact premium standard showcased in our galleries.</p>
          </details>
          <details className="faq-item">
            <summary className="serif">What is the difference between booking here and on Airbnb? <ChevronDown size={20} className="text-primary" /></summary>
            <p>Booking directly on our website eliminates high third-party service fees (saving you up to 15%), grants you priority support via WhatsApp, offers more flexible check-in times upon request, and unlocks exclusive add-ons like airport transfers.</p>
          </details>
          <details className="faq-item">
            <summary className="serif">Do you require a security deposit? <ChevronDown size={20} className="text-primary" /></summary>
            <p>Yes, a standard refundable caution deposit is required prior to check-in to protect against damages. It is fully refunded within 24 hours of checkout following a satisfactory property inspection.</p>
          </details>
          <details className="faq-item" style={{ borderBottom: 'none' }}>
            <summary className="serif">Can I host a party or professional photoshoot? <ChevronDown size={20} className="text-primary" /></summary>
            <p>To preserve the pristine condition of our luxury units and respect our neighbors, parties and large events are strictly prohibited. Photoshoots require written pre-approval and may attract a specific commercial rate.</p>
          </details>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="cta-section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, background: 'radial-gradient(circle at center, rgba(238, 29, 82, 0.1) 0%, transparent 60%)', zIndex: 0 }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="heading-lg">
            <span className="serif">Ready for the Ultimate Stay?</span><br/>
            <span className="serif text-primary">Book Direct & Experience More.</span>
          </h2>
          <p style={{ fontSize: '1.1rem' }}>
            Secure your dates now to lock in our guaranteed lowest rates and unlock exclusive complimentary perks. Seamless payment, zero extra fees.
          </p>
          <div className="cta-actions">
            <Link href="/book" className="btn btn-primary" style={{ padding: '1.25rem 3rem', fontSize: '1.1rem' }}>Search Dates & Availability</Link>
            <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" className="btn btn-outline-white" style={{ padding: '1.25rem 3rem', fontSize: '1.1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
               <MessageSquare size={20} /> Chat with Concierge
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ padding: '6rem 0 3rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-dark)' }}>
        <div className="container">
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', alignItems: 'start' }}>
            {/* Brand Column */}
            <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: '1 / span 2', maxWidth: '380px' }}>
               <div style={{ display: 'inline-block' }}>
                 <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                   <BrandLogo variant="footer" />
                 </Link>
               </div>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.90rem', lineHeight: '1.8' }}>
                 Curating Lagos' most refined stays. We guarantee absolute calm, elite biometric security, uninterrupted power, and blazing enterprise connectivity for the discerning traveler.
               </p>
               <div className="footer-socials" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                 <a href="#" className="social-circle" aria-label="Instagram"><Instagram size={16} /></a>
                 <a href="#" className="social-circle" aria-label="LinkedIn"><Linkedin size={16} /></a>
                 <a href="#" className="social-circle" aria-label="Twitter"><Twitter size={16} /></a>
               </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h4 className="serif" style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'white', letterSpacing: '0.05em' }}>Residences</h4>
              <ul className="footer-links-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <li><Link href="/property" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-primary">Windsor Residence</Link></li>
                <li><Link href="/property" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-primary">Kensington Lodge</Link></li>
                <li><Link href="/property" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-primary">Mayfair Suite</Link></li>
                <li><Link href="/guide" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-primary">Digital Guest Guide</Link></li>
              </ul>
            </div>

            {/* Support Links */}
            <div className="footer-column">
              <h4 className="serif" style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'white', letterSpacing: '0.05em' }}>Company</h4>
              <ul className="footer-links-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <li><a href="#promise" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-primary">The Blissful Promise</a></li>
                <li><a href="#gallery" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-primary">Gallery</a></li>
                <li><Link href="/" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-primary">Privacy Policy</Link></li>
                <li><Link href="/" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover-primary">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer-column" id="contact">
              <h4 className="serif" style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'white', letterSpacing: '0.05em' }}>Connect</h4>
              <ul className="footer-contact-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                   <MapPin size={20} className="text-primary" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                   <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>16 Tebun Fagbemi Street,<br/>Ijaiye, Lagos</span>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <MessageSquare size={20} className="text-primary" style={{ flexShrink: 0 }} />
                   <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)' }} className="hover-white">24/7 WhatsApp Concierge</a>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}><span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>@</span></div>
                   <a href="mailto:reservations@blissfulplace.com" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'color 0.2s' }} className="hover-white">reservations@blissfulplace.com</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem', marginTop: '5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              &copy; {new Date().getFullYear()} Blissful Place Residences. All rights reserved.
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>
              <span className="serif" style={{ fontStyle: 'italic' }}>Uncompromised Luxury.</span>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Sticky WhatsApp Button */}
      <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label="Chat with us on WhatsApp">
        <MessageSquare size={28} />
      </a>
    </main>
  );
}

type BrandLogoProps = {
  variant?: "nav" | "footer";
};

function BrandLogo({ variant = "nav" }: BrandLogoProps) {
  return (
    <span className={`brand-logo brand-logo-${variant}`} aria-label="Blissful Place Residences">
      <Image
        src="/blissful_place_logo-.png"
        alt="Blissful Place Residences"
        width={1024}
        height={326}
        className={`brand-logo-image ${variant === "footer" ? "brand-logo-image-footer" : ""}`}
        priority={variant === "nav"}
      />
    </span>
  );
}
