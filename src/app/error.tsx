"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ─── Icon — Broken Key (thin keyline SVG) ─────────────────────────────────────

function BrokenKeyIcon() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="40" r="14" stroke="#EE1D52" strokeWidth="2" />
      <circle cx="24" cy="40" r="6" stroke="#EE1D52" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="37" y1="40" x2="44" y2="40" stroke="#EE1D52" strokeWidth="2" strokeLinecap="round" />
      <line x1="43" y1="33" x2="48" y2="47" stroke="#EE1D52" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.65" />
      <line x1="49" y1="40" x2="67" y2="40" stroke="#EE1D52" strokeWidth="2" strokeLinecap="round" />
      <line x1="56" y1="40" x2="56" y2="48" stroke="#EE1D52" strokeWidth="2" strokeLinecap="round" />
      <line x1="62" y1="40" x2="62" y2="45" stroke="#EE1D52" strokeWidth="2" strokeLinecap="round" />
    </svg>
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

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [resetting, setResetting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.error("[ErrorBoundary]", error.message);
  }, [error]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleReset() {
    if (resetting) return;
    setResetting(true);
    setTimeout(reset, 550);
  }

  return (
    <>
      <style href="error-styles" precedence="default">{`
        @keyframes err-bg-breathe {
          0%, 100% { background-color: #0A0A0B; }
          50%       { background-color: #130B0F; }
        }
        .err-shell {
          animation: err-bg-breathe 9s ease-in-out infinite;
        }
        .err-btn-primary {
          display: inline-block;
          padding: 0.875rem 2rem;
          border-radius: 9999px;
          background-color: #EE1D52;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: box-shadow 0.3s;
        }
        .err-btn-primary:hover:not(:disabled) {
          box-shadow: 0 0 38px rgba(238, 29, 82, 0.6);
        }
        .err-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .err-btn-ghost {
          display: inline-block;
          padding: 0.875rem 2rem;
          border-radius: 9999px;
          border: 1px solid rgba(238, 29, 82, 0.5);
          color: #EE1D52;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .err-btn-ghost:hover {
          border-color: #EE1D52;
          box-shadow: 0 0 28px rgba(238, 29, 82, 0.35);
        }
      `}</style>

      {/* Full-viewport fixed overlay */}
      <div
        className="err-shell"
        data-testid="error-root"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "0 1.5rem",
        }}
      >
        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "32rem",
            margin: "0 auto",
          }}
        >
          {/* Icon — gentle float */}
          <motion.div
            initial={mounted ? { opacity: 0, scale: 0.8, y: 20 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease }}
          >
            <motion.div
              animate={mounted ? { rotate: [-3, 3, -3], y: [0, -5, 0] } : {}}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Backdrop ring */}
              <div
                style={{
                  width: "6rem",
                  height: "6rem",
                  borderRadius: "50%",
                  backgroundColor: "rgba(238,29,82,0.07)",
                  border: "1px solid rgba(238,29,82,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <motion.div
                  animate={resetting ? { rotate: [0, 360] } : {}}
                  transition={resetting ? { duration: 0.55, ease: "easeInOut" } : {}}
                >
                  <BrokenKeyIcon />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Decorative rule */}
          <motion.div
            initial={mounted ? { opacity: 0, scaleX: 0 } : false}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.25 }}
            style={{
              width: "3.5rem",
              height: "1px",
              backgroundColor: "rgba(238, 29, 82, 0.5)",
              marginTop: "2rem",
              marginBottom: "1.75rem",
              transformOrigin: "center",
            }}
          />

          {/* Serif heading */}
          <motion.h1
            {...fadeUp(0.32, mounted)}
            style={{
              fontFamily: "var(--font-serif, 'Playfair Display', 'Times New Roman', serif)",
              fontStyle: "italic",
              color: "#ffffff",
              fontSize: "clamp(1.875rem, 4vw, 2.5rem)",
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Something Went Wrong
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...fadeUp(0.48, mounted)}
            style={{
              marginTop: "1.25rem",
              color: "#AAA8A9",
              fontSize: "1.0625rem",
              lineHeight: 1.7,
              maxWidth: "24rem",
            }}
          >
            We encountered an unexpected issue.
            {" "}Our team has been notified.
          </motion.p>

          {/* Actions */}
          <motion.div
            {...fadeUp(0.63, mounted)}
            style={{
              marginTop: "2.5rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            {/* Try Again */}
            <motion.button
              onClick={handleReset}
              disabled={resetting}
              whileHover={mounted ? { scale: 1.05 } : {}}
              whileTap={mounted ? { scale: 0.96 } : {}}
              transition={{ type: "spring", stiffness: 340, damping: 20 }}
              className="err-btn-primary"
            >
              Try Again
            </motion.button>

            {/* Return Home */}
            <motion.div
              whileHover={mounted ? { scale: 1.05 } : {}}
              whileTap={mounted ? { scale: 0.96 } : {}}
              transition={{ type: "spring", stiffness: 340, damping: 20 }}
            >
              <Link href="/" className="err-btn-ghost">
                Return Home
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
