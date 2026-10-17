import type { calculate, EngineInput } from "../../backend/src/consumer/engine";
export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};
export type State = ReturnType<typeof calculate> & {
  id?: string;
  stateId?: string;
};
export type Dashboard = {
  spending: { from: string; to: string; days: number; count: number; total: number; daily: number | null };
  requiresOnboarding: boolean;
  user: User;
  consent: boolean;
  inputs: EngineInput;
  state: State;
  history: { id: string; generatedAt: string; reason: string }[];
};
let refresh: Promise<boolean> | null = null;
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  retry = true,
): Promise<T> {
  const response = await fetch("/api/consumer" + path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (
    response.status === 401 &&
    retry &&
    !["/login", "/register", "/refresh"].includes(path)
  ) {
    refresh ??= fetch("/api/consumer/refresh", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((result) => result.ok)
      .finally(() => {
        refresh = null;
      });
    if (await refresh) return api<T>(path, method, body, false);
  }
  const result = await response
    .json()
    .catch(() => ({ message: "The server is unavailable. Please try again." }));
  if (!response.ok)
    throw Object.assign(
      new Error(result.message || "Something went wrong. Please try again."),
      { status: response.status },
    );
  return result as T;
}
export const money = (kobo: number | null) =>
  kobo === null
    ? "—"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: kobo % 100 ? 2 : 0,
      }).format(kobo / 100);
export function kobo(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  if (!/^\d+(\.\d{1,2})?$/.test(text))
    throw new Error("Enter a valid amount with up to two decimal places.");
  const [whole, fraction = ""] = text.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount > 1_000_000_000_000)
    throw new Error("That amount is too large.");
  return amount;
}
