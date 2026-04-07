"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#0A0A0B",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          padding: "0 1.5rem",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
              fontWeight: 700,
              marginBottom: "1rem",
              color: "#ffffff",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#AAA8A9",
              fontSize: "1rem",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            A critical error occurred. Please try again or return to the homepage.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "9999px",
                backgroundColor: "#EE1D52",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "9999px",
                border: "1px solid rgba(238, 29, 82, 0.5)",
                color: "#EE1D52",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
