import Link from "next/link";
import { ArrowLeft, Shield, Zap, Wifi, MessageSquare, Phone, Info, Clock, AlertTriangle, Coffee } from "@/lib/lucide-react";

export default function GuestGuide() {
  return (
    <main className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem', minHeight: '100vh', maxWidth: '800px' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 500, transition: 'color 0.2s' }} className="hover-primary">
          <ArrowLeft size={16} /> Back to Homepage
        </Link>
        <h1 className="heading-lg serif">Digital Guest Concierge</h1>
        <p className="text-secondary" style={{ fontSize: '1.1rem' }}>Everything you need for a seamless, luxurious stay in Lagos.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Power Section */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             <Zap className="text-primary" size={24} /> 24/7 Power Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Lagos power grids can fluctuate, but your experience won't. Our building operates a fully automated dual-grid system hooked directly to heavy-duty industrial backup generators. 
          </p>
          <div style={{ background: 'rgba(238, 29, 82, 0.05)', borderLeft: '4px solid var(--primary)', padding: '1rem', borderRadius: '0 4px 4px 0' }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>No Action Required</strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>If city power drops, our generators kick in automatically within 3 seconds. The AC, lights, and WiFi will remain uninterrupted.</span>
          </div>
        </section>

        {/* Internet Section */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             <Wifi className="text-primary" size={24} /> High-Speed Internet
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
             We understand that reliable internet is crucial for our corporate and diaspora guests. We use a blended hybrid approach to guarantee uptime.
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>Primary Network:</strong> Enterprise Starlink (Avg 150 Mbps down)</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Failover Network:</strong> Dedicated Fiber Optics</li>
            <li>*Login details are provided securely in your WhatsApp orientation packet upon check-in.*</li>
          </ul>
        </section>

        {/* Security Section */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             <Shield className="text-primary" size={24} /> Estate Security & Access
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Your safety is our absolute priority. The estate is fortified with 24/7 armed mobile police patrols, comprehensive CCTV, and biometric access control.
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li>No unverified guests are permitted past the main gate without your direct authorization via intercom.</li>
            <li>Use the provided smart keycard for elevator and door access.</li>
          </ul>
        </section>
        
        {/* Support Section */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             <MessageSquare className="text-primary" size={24} /> Concierge & Support
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Our hospitality team is available 24/7 via WhatsApp to arrange airport pickups, grocery stocking, cleaning, or general maintenance requests.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <MessageSquare size={16} /> WhatsApp Concierge
              </a>
              <a href="tel:+2340000000000" className="btn btn-outline-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <Phone size={16} /> Emergency Call
              </a>
          </div>
        </section>

      </div>
    </main>
  );
}
