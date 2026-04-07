"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  id: number;
  size: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
  opacity: number;
  isRose: boolean;
}

// ─── Particles ────────────────────────────────────────────────────────────────

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 13 }, (_, i) => ({
        id: i,
        size: 55 + Math.random() * 105,
        left: Math.random() * 96,
        top: Math.random() * 92,
        duration: 18 + Math.random() * 22,
        delay: -(Math.random() * 28),
        opacity: 0.025 + Math.random() * 0.055,
        isRose: i % 3 !== 2,
      }))
    );
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            borderRadius: "50%",
            filter: "blur(64px)",
            backgroundColor: p.isRose ? "#EE1D52" : "#ffffff",
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            translateX: "-50%",
            translateY: "-50%",
          }}
          animate={{ y: [0, -20, 10, 0], x: [0, 14, -9, 0] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─── Animation helpers ────────────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay: number, mounted: boolean) => ({
  initial: mounted ? { opacity: 0, y: 24 } : false,
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.85, ease, delay },
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes shimmer-404 {
          from { background-position: 0%   center; }
          to   { background-position: 200% center; }
        }
        .nf-shimmer {
          background: linear-gradient(
            90deg,
            #EE1D52  0%,
            #ff8fa3 32%,
            #ffffff 50%,
            #ff8fa3 68%,
            #EE1D52 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-404 5.5s linear infinite;
        }
        .nf-btn-primary {
          display: inline-block;
          padding: 0.875rem 2rem;
          border-radius: 9999px;
          background-color: #EE1D52;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          transition: box-shadow 0.3s;
        }
        .nf-btn-primary:hover {
          box-shadow: 0 0 38px rgba(238, 29, 82, 0.6);
        }
        .nf-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #EE1D52;
          text-decoration: none;
        }
        .nf-btn-secondary:hover {
          text-decoration: underline;
        }
        .nf-arrow {
          display: inline-block;
          transition: transform 0.2s;
        }
        .nf-btn-secondary:hover .nf-arrow {
          transform: translateX(4px);
        }
      `}</style>

      {/* Full-viewport fixed overlay — escapes any parent layout flow */}
      <div
        data-testid="not-found-root"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#0A0A0B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <FloatingParticles />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "0 1.5rem",
            maxWidth: "36rem",
            margin: "0 auto",
          }}
        >
          {/* 404 — shimmer */}
          <motion.div
            initial={mounted ? { opacity: 0, scale: 0.9, y: 24 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.05, ease }}
          >
            <span
              className="nf-shimmer"
              style={{
                display: "block",
                fontWeight: 700,
                lineHeight: 1,
                userSelect: "none",
                fontSize: "clamp(4.5rem, min(18vw, 18vh), 9rem)",
                letterSpacing: "-0.04em",
              }}
            >
              404
            </span>
          </motion.div>

          {/* Decorative rule */}
          <motion.div
            initial={mounted ? { opacity: 0, scaleX: 0 } : false}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.22 }}
            style={{
              width: "3.5rem",
              height: "1px",
              backgroundColor: "rgba(238, 29, 82, 0.5)",
              marginTop: "0.25rem",
              marginBottom: "1.75rem",
              transformOrigin: "center",
            }}
          />

          {/* Serif heading */}
          <motion.h1
            {...fadeUp(0.3, mounted)}
            style={{
              fontFamily: "'Playfair Display', 'Times New Roman', serif",
              fontStyle: "italic",
              color: "#ffffff",
              fontSize: "clamp(1.875rem, 4vw, 2.6rem)",
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            This Room Doesn't Exist
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...fadeUp(0.46, mounted)}
            style={{
              marginTop: "1.25rem",
              color: "#AAA8A9",
              fontSize: "1.0625rem",
              lineHeight: 1.7,
              maxWidth: "24rem",
            }}
          >
            The page you're looking for may have been moved
            {" "}or is no longer available.
          </motion.p>

          {/* Actions */}
          <motion.div
            {...fadeUp(0.62, mounted)}
            style={{
              marginTop: "2.5rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.25rem",
            }}
          >
            {/* Primary CTA */}
            <motion.div
              whileHover={mounted ? { scale: 1.05 } : {}}
              whileTap={mounted ? { scale: 0.96 } : {}}
              transition={{ type: "spring", stiffness: 340, damping: 20 }}
            >
              <Link href="/" className="nf-btn-primary">
                Return to Lobby
              </Link>
            </motion.div>

            {/* Secondary link */}
            <motion.div
              whileHover={mounted ? { x: 4 } : {}}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              <Link href="/property" className="nf-btn-secondary">
                Explore Residences
                <span className="nf-arrow">→</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
