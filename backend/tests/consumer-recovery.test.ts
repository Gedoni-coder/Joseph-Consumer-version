import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createHash } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createAuthDatabase } from "./helpers/auth-database";

const { db, jobs, send, enabled, stores } = vi.hoisted(() => ({
  db: {} as any,
  jobs: [] as Promise<unknown>[],
  send: vi.fn(),
  enabled: { value: true },
  stores: [] as any[],
}));
vi.mock("express-rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("express-rate-limit")>();
  return {
    ...actual,
    default: (options: any) => {
      const store = new actual.MemoryStore();
      stores.push(store);
      return actual.default({ ...options, store });
    },
  };
});
vi.mock("../src/config/prisma", () => ({ prisma: db }));
vi.mock("@vercel/functions", () => ({
  waitUntil: (job: Promise<unknown>) => jobs.push(job),
}));
vi.mock("../src/consumer/recovery-mail", () => ({
  recoveryConfigured: () => enabled.value,
  sendRecoveryEmail: send,
}));
process.env.JWT_SECRET = "test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters";
const origin = "https://joseph.example";
process.env.FRONTEND_URL = origin;
const app = (await import("../src/consumer-app")).default;
const auth = await import("../src/services/prisma/authService");
const sessions = await import("../src/services/prisma/authSessionService");

describe("consumer password recovery", () => {
  let server: Server,
    url: string,
    fixture: ReturnType<typeof createAuthDatabase>,
    user: any;
  beforeEach(async () => {
    fixture = createAuthDatabase();
    Object.assign(db, fixture.database);
    jobs.length = 0;
    send.mockReset().mockResolvedValue(undefined);
    enabled.value = true;
    user = await auth.registerUser({
      name: "Recovery User",
      email: "recovery@example.com",
      password: "OldPassword42!",
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/consumer`;
    for (const store of stores) await store.resetAll();
  });
  afterEach(async () => {
    await Promise.all(jobs);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  async function post(path: string, body: object, from = origin) {
    const response = await fetch(url + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: from },
      body: JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
      headers: response.headers,
    };
  }
  async function requestToken() {
    const result = await post("/forgot-password", { email: user.email });
    expect(result.status).toBe(202);
    await Promise.all(jobs);
    return send.mock.calls[0][1] as string;
  }
  it("returns the same response for known, unknown and inactive accounts, and never exposes a token", async () => {
    const known = await post("/forgot-password", {
      email: " RECOVERY@example.com ",
    });
    const unknown = await post("/forgot-password", {
      email: "absent@example.com",
    });
    await db.user.create({
      data: {
        email: "inactive@example.com",
        password: "unused",
        isActive: false,
      },
    });
    const inactive = await post("/forgot-password", {
      email: "inactive@example.com",
    });
    await Promise.all(jobs);
    expect(known.status).toBe(202);
    expect(known.body).toEqual(unknown.body);
    expect(inactive.body).toEqual(known.body);
    expect(send).toHaveBeenCalledTimes(1);
    const token = send.mock.calls[0][1];
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(known.body)).not.toContain(token);
    expect(fixture.all("user")[0].resetPasswordToken).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
  });
  it("changes the password once, clears cookies and revokes existing access and refresh sessions", async () => {
    const pair = await sessions.createAuthSession(user);
    const token = await requestToken();
    const result = await post("/reset-password", {
      token,
      password: "NewPassword42!",
    });
    expect(result.status).toBe(200);
    expect(
      result.headers
        .getSetCookie()
        .every((value) => value.includes("Expires=Thu, 01 Jan 1970")),
    ).toBe(true);
    expect(
      (await post("/reset-password", { token, password: "OtherPassword42!" }))
        .status,
    ).toBe(400);
    await expect(
      auth.verifyCredentials(user.email, "OldPassword42!"),
    ).rejects.toThrow();
    await expect(
      auth.verifyCredentials(user.email, "NewPassword42!"),
    ).resolves.toHaveProperty("id", user.id);
    await expect(
      sessions.rotateAuthSession(pair.refreshToken),
    ).rejects.toThrow();
    const me = await fetch(url + "/me", {
      headers: { Cookie: `joseph_access=${pair.accessToken}` },
    });
    expect(me.status).toBe(401);
  });
  it("rejects expired links and passwords exceeding bcrypt's byte limit", async () => {
    const token = await requestToken();
    expect(
      (
        await post("/reset-password", {
          token,
          password: "Aa1" + "é".repeat(35),
        })
      ).status,
    ).toBe(400);
    expect(
      (await post("/reset-password", { token, password: "weak" })).status,
    ).toBe(400);
    await db.user.update({
      where: { id: user.id },
      data: { resetPasswordExpires: new Date(Date.now() - 1) },
    });
    expect(
      (await post("/reset-password", { token, password: "NewPassword42!" }))
        .status,
    ).toBe(400);
  });
  it("serializes token issuance and consumption, with a persistent cooldown", async () => {
    const results = await Promise.all([
      auth.generatePasswordReset(user.email),
      auth.generatePasswordReset(user.email),
    ]);
    expect(results.filter((r) => r.token)).toHaveLength(1);
    const token = results.find((r) => r.token)!.token;
    const reset = await Promise.all([
      post("/reset-password", { token, password: "NewPassword42!" }),
      post("/reset-password", { token, password: "OtherPassword42!" }),
    ]);
    expect(reset.map((r) => r.status).sort()).toEqual([200, 400]);
  });
  it("invalidates an outstanding reset link when the signed-in password changes", async () => {
    const token = await requestToken();
    await auth.changeUserPassword(
      user.id,
      "OldPassword42!",
      "ChangedPassword42!",
    );
    expect(
      (await post("/reset-password", { token, password: "NewPassword42!" }))
        .status,
    ).toBe(400);
  });
  it("fails honestly without email configuration and rejects cross-origin requests", async () => {
    enabled.value = false;
    expect((await post("/forgot-password", { email: user.email })).status).toBe(
      503,
    );
    expect(send).not.toHaveBeenCalled();
    expect(
      (
        await post(
          "/forgot-password",
          { email: user.email },
          "https://untrusted.example",
        )
      ).status,
    ).toBe(403);
  });
  it("does not leak provider errors and limits reset requests", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockRejectedValue(new Error("private provider response"));
    expect((await post("/forgot-password", { email: user.email })).status).toBe(
      202,
    );
    await Promise.all(jobs);
    expect(log).toHaveBeenCalledWith("Password recovery delivery failed.");
    for (let i = 0; i < 4; i++)
      expect(
        (await post("/forgot-password", { email: "absent@example.com" }))
          .status,
      ).toBe(202);
    expect((await post("/forgot-password", { email: user.email })).status).toBe(
      429,
    );
  });
});

// SR
