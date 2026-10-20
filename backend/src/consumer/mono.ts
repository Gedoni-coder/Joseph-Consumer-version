import { MAX_MONEY } from "./engine";

export const BANK_CONSENT_VERSION = "mono-sandbox-2026-10-16";
export const bankError = (message: string, status = 400) =>
  Object.assign(new Error(message), { status });
export function monoConfigured() {
  // This release is sandbox-only. A live credential must never silently enable real banking.
  return (
    !!process.env.MONO_SECRET_KEY?.startsWith("test_sk_") &&
    !!process.env.MONO_PUBLIC_KEY?.startsWith("test_pk_")
  );
}
export async function monoRequest(path: string, body?: object) {
  if (!monoConfigured())
    throw bankError(
      "Bank testing is not configured yet. You can continue with your plan.",
      503,
    );
  let response: globalThis.Response;
  try {
    response = await fetch("https://api.withmono.com/v2" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "mono-sec-key": process.env.MONO_SECRET_KEY!,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw bankError(
      "Mono is taking longer than expected. Please try again.",
      502,
    );
  }
  const payload = (await response.json().catch(() => null)) as {
    status?: string;
    data?: { id?: unknown };
    id?: unknown;
  } | null;
  if (
    !response.ok ||
    !payload ||
    payload.status === "failed" ||
    payload.status === "error"
  ) {
    // Never expose vendor payloads, request headers or credentials to clients/logs.
    throw bankError(
      response.status === 401 || response.status === 403
        ? "Mono could not authorise this request. Please reconnect or try again later."
        : "Mono could not complete this request. Please try again.",
      502,
    );
  }
  return payload;
}
export async function exchangeMonoCode(code: string): Promise<string> {
  const result = await monoRequest("/accounts/auth", { code });
  const id = result.data?.id ?? result.id;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(id))
    throw bankError(
      "Mono did not return a valid account. Please reconnect.",
      502,
    );
  return id;
}
export function normaliseMonoAccount(payload: any) {
  const data = payload?.data;
  const account = data?.account;
  if (!account || typeof account !== "object")
    throw bankError(
      "Bank details are still processing. Please refresh shortly.",
      502,
    );
  const status = String(data.meta?.data_status || "").toUpperCase();
  const ready =
    status === "AVAILABLE" ||
    (status === "PARTIAL" &&
      Array.isArray(data.meta?.retrieved_data) &&
      data.meta.retrieved_data.includes("balance"));
  const currency = String(account.currency || "").toUpperCase();
  const balance = account.balance;
  // Mono NGN values are already kobo. Missing/invalid data is not a zero balance.
  if (
    ready &&
    (currency !== "NGN" ||
      typeof balance !== "number" ||
      !Number.isSafeInteger(balance) ||
      balance < 0 ||
      balance > MAX_MONEY)
  ) {
    throw bankError(
      "This account does not have a supported NGN available balance.",
      422,
    );
  }
  const number = String(account.account_number ?? account.accountNumber ?? "");
  return {
    bankName: String(account.institution?.name || "Connected bank").slice(
      0,
      100,
    ),
    accountName: String(account.name || "").slice(0, 100),
    last4: number.slice(-4),
    currency: currency || "NGN",
    balance: ready ? BigInt(balance) : null,
    status: ready
      ? "connected"
      : status === "FAILED" || status === "UNAVAILABLE"
        ? "unavailable"
        : "processing",
    syncedAt: ready ? new Date() : null,
  };
}
export const fetchMonoAccount = async (id: string) =>
  normaliseMonoAccount(
    await monoRequest("/accounts/" + encodeURIComponent(id)),
  );
export const unlinkMonoAccount = async (id: string) =>
  monoRequest("/accounts/" + encodeURIComponent(id) + "/unlink", {});

// SR
