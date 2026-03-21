"use client";

import { useState } from "react";

import { logoutStaffAdmin } from "@/lib/auth-frontend-api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to log out right now.";
}

export function AdminLogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await logoutStaffAdmin();
      window.location.assign("/login");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-session-controls">
      <button type="button" className="btn btn-outline-white" onClick={() => void handleLogout()} disabled={isSubmitting}>
        {isSubmitting ? "Signing Out..." : "Sign Out"}
      </button>
      {errorMessage && <p className="admin-session-error">{errorMessage}</p>}
    </div>
  );
}
