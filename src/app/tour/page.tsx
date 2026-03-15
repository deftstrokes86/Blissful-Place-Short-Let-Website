"use client";

import Link from "next/link";
import { ArrowLeft, Clock } from "@/lib/lucide-react";
import { useState } from "react";

export default function Tour() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const SLOTS = [
    { time: "09:00 AM", available: false },
    { time: "10:30 AM", available: true },
    { time: "12:00 PM", available: true },
    { time: "01:30 PM", available: false },
    { time: "03:00 PM", available: true },
    { time: "04:30 PM", available: true },
  ];

  return (
    <main className="container" style={{ paddingTop: '6rem', minHeight: '100vh', maxWidth: '800px' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className="heading-ld serif" style={{ marginTop: '1rem' }}>Schedule a Private Tour</h1>
        <p className="text-secondary">Select an available time slot to view our luxury residences in person.</p>
      </div>

      <div style={{ background: 'var(--bg-panel)', padding: '3rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <Clock size={40} className="text-primary" style={{ margin: '0 auto 1.5rem' }} />
        <h2 className="heading-sm serif" style={{ marginBottom: '2.5rem' }}>Wednesday, October 21, 2026</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          {SLOTS.map(({ time, available }) => {
            const isSelected = selectedSlot === time;
            return (
              <button
                key={time}
                onClick={() => available && setSelectedSlot(time)}
                disabled={!available}
                style={{
                  padding: '1.25rem',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--primary)' : (available ? 'transparent' : 'rgba(255,255,255,0.02)'),
                  color: isSelected ? '#fff' : (available ? 'var(--text-primary)' : 'var(--text-secondary)'),
                  cursor: available ? 'pointer' : 'not-allowed',
                  opacity: available ? 1 : 0.5,
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {time}
                {!available && <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.6rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booked</span>}
              </button>
            )
          })}
        </div>

        <button className="btn btn-primary btn-full" disabled={!selectedSlot} style={{ padding: '1.25rem', fontSize: '1.1rem', opacity: !selectedSlot ? 0.5 : 1 }}>
          Confirm Tour Appointment
        </button>
      </div>
    </main>
  );
}
