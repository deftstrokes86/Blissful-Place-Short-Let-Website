"use client";

import { FormEvent, useState } from "react";

import { loginStaffAdmin } from "@/lib/auth-frontend-api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to sign in right now. Please try again.";
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await loginStaffAdmin({
        email,
        password,
      });

      window.location.assign(result.redirectTo);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="auth-field">
        <label className="admin-label" htmlFor="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          className="standard-input"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="auth-field">
        <label className="admin-label" htmlFor="auth-password">
          Password
        </label>
        <input
          id="auth-password"
          type="password"
          className="standard-input"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      {errorMessage && <div className="booking-inline-note booking-inline-note-muted">{errorMessage}</div>}

      <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}
