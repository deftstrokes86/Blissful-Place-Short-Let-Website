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

export interface InternalAuthUserSnapshot {
  id: string;
  email: string;
  role: "admin" | "staff";
}

export interface LoginStaffAdminResponse {
  user: InternalAuthUserSnapshot;
  redirectTo: string;
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

export async function loginStaffAdmin(input: {
  email: string;
  password: string;
}): Promise<LoginStaffAdminResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });

  return readJsonResponse<LoginStaffAdminResponse>(response);
}

export async function logoutStaffAdmin(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  await readJsonResponse<{ success: boolean }>(response);
}

export async function getCurrentStaffAdminSession(): Promise<InternalAuthUserSnapshot> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ user: InternalAuthUserSnapshot }>(response);
  return payload.user;
}
