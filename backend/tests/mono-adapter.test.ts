import { afterEach, describe, expect, it, vi } from "vitest";
import { normaliseMonoAccount, monoRequest } from "../src/consumer/mono";
const payload = (
  balance: unknown = 123456,
  meta: object = { data_status: "AVAILABLE" },
  currency = "NGN",
) => ({
  data: {
    account: {
      balance,
      currency,
      name: "Test Account",
      account_number: "0123456789",
      institution: { name: "Test Bank" },
    },
    meta,
  },
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Mono canonical account boundary", () => {
  it("preserves integer kobo and only the last four account digits", () => {
    const bank = normaliseMonoAccount(payload());
    expect(bank.balance).toBe(123456n);
    expect(bank.last4).toBe("6789");
    expect(bank.status).toBe("connected");
    expect(
      JSON.stringify({ ...bank, balance: Number(bank.balance) }),
    ).not.toContain("0123456789");
  });
  it("does not turn missing or processing data into a zero balance", () => {
    expect(
      normaliseMonoAccount(payload(undefined, { data_status: "PROCESSING" }))
        .balance,
    ).toBeNull();
    expect(
      normaliseMonoAccount(
        payload(500, {
          data_status: "PARTIAL",
          retrieved_data: ["transactions"],
        }),
      ).balance,
    ).toBeNull();
    expect(
      normaliseMonoAccount(
        payload(500, { data_status: "PARTIAL", retrieved_data: ["balance"] }),
      ).balance,
    ).toBe(500n);
  });
  it.each([-1, 1.2, Number.MAX_SAFE_INTEGER, "100", null])(
    "rejects unsupported balance %s",
    (balance) => {
      expect(() => normaliseMonoAccount(payload(balance))).toThrow(
        "supported NGN",
      );
    },
  );
  it("rejects non-NGN accounts and malformed payloads", () => {
    expect(() => normaliseMonoAccount(payload(1, undefined, "USD"))).toThrow(
      "supported NGN",
    );
    expect(() => normaliseMonoAccount({ data: {} })).toThrow("processing");
  });
  it("does not allow live credentials to silently enable this sandbox release", async () => {
    vi.stubEnv("MONO_SECRET_KEY", "live_sk_test");
    vi.stubEnv("MONO_PUBLIC_KEY", "test_pk_test");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(monoRequest("/accounts")).rejects.toMatchObject({
      status: 503,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("redacts upstream credential and payload errors", async () => {
    vi.stubEnv("MONO_SECRET_KEY", "test_sk_private");
    vi.stubEnv("MONO_PUBLIC_KEY", "test_pk_test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ message: "test_sk_private internal dump" }),
            { status: 401 },
          ),
        ),
    );
    await expect(monoRequest("/accounts")).rejects.toThrow(
      "could not authorise",
    );
  });
});
