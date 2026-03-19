import type { PaymentMethod } from "@/types/booking";

interface BranchReviewCopy {
  title: string;
  description: string;
}

const BRANCH_REVIEW_COPY: Record<PaymentMethod, BranchReviewCopy> = {
  website: {
    title: "Secure Website Payment",
    description: "Redirecting to our secure payment gateway for immediate booking confirmation.",
  },
  transfer: {
    title: "Bank Transfer Path",
    description: "Next, you'll get our banking details. A 1-hour hold will be placed on your dates.",
  },
  pos: {
    title: "POS Coordination Path",
    description: "Submit your request now. Our concierge will contact you to coordinate card payment.",
  },
};

export function getBranchReviewCopy(method: PaymentMethod): BranchReviewCopy {
  return BRANCH_REVIEW_COPY[method];
}

export function getBranchPolicyText(paymentMethod: PaymentMethod | null): string {
  if (paymentMethod === "website") {
    return "Confirmation is issued only after successful gateway completion.";
  }

  if (paymentMethod === "transfer") {
    return "Transfer submissions remain pending until manual verification is complete.";
  }

  if (paymentMethod === "pos") {
    return "POS requests stay pending until card payment is completed with concierge support.";
  }

  return "Select a payment path to view branch-specific policy.";
}
