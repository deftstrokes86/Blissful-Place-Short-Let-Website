interface ApiErrorShape {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

interface ApiSuccessShape<T> {
  ok: true;
  data: T;
}

type ApiResponseShape<T> = ApiErrorShape | ApiSuccessShape<T>;

export interface AdminNotificationListItem {
  id: string;
  eventType: string;
  audience: "guest" | "staff";
  channel: "email" | "internal";
  reservationId: string | null;
  reservationToken: string | null;
  status: "pending" | "sent" | "failed";
  title: string;
  summary: string;
  createdAt: string;
  sentAt: string | null;
  errorMessage: string | null;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponseShape<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponseShape<T>;
  } catch {
    throw new Error("Request failed. Please try again.");
  }

  if (!payload) {
    throw new Error("Request failed. Please try again.");
  }

  if (!response.ok || !payload.ok) {
    if (!payload.ok) {
      throw new Error(payload.error.message);
    }

    throw new Error("Request failed. Please try again.");
  }

  return payload.data;
}

export async function fetchInternalAdminNotifications(limit?: number): Promise<AdminNotificationListItem[]> {
  const query = typeof limit === "number" ? `?limit=${encodeURIComponent(String(limit))}` : "";

  const response = await fetch(`/api/operations/notifications/internal${query}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ notifications: AdminNotificationListItem[] }>(response);
  return payload.notifications;
}
