"use client";

import Link from "next/link";
import { ArrowLeft, Check, X } from "@/lib/lucide-react";
import { useState } from "react";

// Mock data: true = available, false = booked
const generateMockDates = () => {
  const dates = [];
  const startDay = 1; // e.g. starting on a Monday
  for (let i = 1; i <= 31; i++) {
    // Make weekends and random dates booked
    const isWeekend = (i + startDay) % 7 === 0 || (i + startDay) % 7 === 6;
    const isRandomlyBooked = Math.random() < 0.3;
    dates.push({
      day: i,
      available: !(isWeekend && isRandomlyBooked),
      price: i % 5 === 0 ? "₦300k" : "₦250k"
    });
  }
  return dates;
};

const MOCK_DATES = generateMockDates();
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Availability() {
  const [selectedDates, setSelectedDates] = useState<number[]>([]);

  const toggleDate = (day: number, available: boolean) => {
    if (!available) return;
    if (selectedDates.includes(day)) {
      setSelectedDates(selectedDates.filter(d => d !== day));
    } else {
      setSelectedDates([...selectedDates, day]);
    }
  };

  return (
    <main className="container" style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <div style={{ marginBottom: '3rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className="heading-ld serif" style={{ marginTop: '1rem' }}>Live Availability</h1>
        <p className="text-secondary">Select your dates to view exact pricing and availability.</p>
      </div>

      <div style={{ background: 'var(--bg-panel)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className="heading-sm">October 2026</h2>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'transparent', border: '1px solid var(--border-subtle)' }} /> Available
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', opacity: '0.2' }} /> Booked
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} /> Selected
            </span>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '1rem',
          textAlign: 'center'
        }}>
          {DAYS_OF_WEEK.map(day => (
            <div key={day} style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {day}
            </div>
          ))}

          {/* Empty offset for month start */}
          <div /><div /><div /><div />

          {MOCK_DATES.map(({ day, available, price }) => {
            const isSelected = selectedDates.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleDate(day, available)}
                disabled={!available}
                style={{
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  background: isSelected ? 'var(--primary)' : (available ? 'transparent' : 'rgba(238, 29, 82, 0.05)'),
                  color: isSelected ? '#fff' : (available ? 'var(--text-primary)' : 'var(--text-secondary)'),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  opacity: available ? 1 : 0.5,
                  cursor: available ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {!available && (
                  <div style={{ position: 'absolute', top: '0', bottom: '0', left: '0', right: '0', background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(238, 29, 82, 0.1) 10px, rgba(238, 29, 82, 0.1) 20px)' }} />
                )}
                
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', position: 'relative', zIndex: 1 }}>{day}</span>
                {available && <span style={{ fontSize: '0.65rem', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', position: 'relative', zIndex: 1 }}>{price}</span>}
                {!available && <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', position: 'relative', zIndex: 1 }}>Booked</span>}
              </button>
            );
          })}
        </div>
        
        <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="heading-sm serif">Selected Dates</h3>
            <p className="text-secondary">{selectedDates.length > 0 ? `${selectedDates.length} nights selected` : 'None selected'}</p>
          </div>
          <button className="btn btn-primary" disabled={selectedDates.length === 0} style={{ opacity: selectedDates.length === 0 ? 0.5 : 1 }}>
            Proceed to Booking
          </button>
        </div>
      </div>
    </main>
  );
}
