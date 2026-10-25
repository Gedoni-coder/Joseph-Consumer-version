import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { createTransport, sendMail, close } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  close: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: { createTransport } }));
import {
  recoveryConfigured,
  sendRecoveryEmail,
} from "../src/consumer/recovery-mail";
describe("recovery email transport", () => {
  beforeEach(() => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_USER", "support@example.com");
    vi.stubEnv("SMTP_PASS", "test-only");
    vi.stubEnv("EMAIL_FROM", "JOSEPH <support@example.com>");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("PASSWORD_RESET_ORIGIN", "https://josephai.online");
    vi.stubEnv("NODE_ENV", "production");
    sendMail.mockResolvedValue({ accepted: ["recipient@example.com"] });
    createTransport.mockReturnValue({ sendMail, close });
  });
  afterEach(() => vi.unstubAllEnvs());
  it("requires complete configuration and a trusted HTTPS origin", () => {
    expect(recoveryConfigured()).toBe(true);
    for (const value of [
      "http://example.com",
      "https://example.com/path",
      "https://a:b@example.com",
      "not-a-url",
    ]) {
      vi.stubEnv("PASSWORD_RESET_ORIGIN", value);
      expect(recoveryConfigured()).toBe(false);
    }
    vi.stubEnv("PASSWORD_RESET_ORIGIN", "https://josephai.online");
    vi.stubEnv("SMTP_PASS", "");
    expect(recoveryConfigured()).toBe(false);
  });
  it.each([465, 587])(
    "requires encrypted delivery on port %s and uses a fragment reset link",
    async (port) => {
      vi.stubEnv("SMTP_PORT", String(port));
      await sendRecoveryEmail("recipient@example.com", "a".repeat(64));
      expect(createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port,
          secure: port === 465,
          requireTLS: true,
          logger: false,
          debug: false,
        }),
      );
      const message = sendMail.mock.calls[0][0];
      expect(message.text).toContain(
        "https://josephai.online/#reset-password=" + "a".repeat(64),
      );
      expect(message.to).toBe("recipient@example.com");
      expect(close).toHaveBeenCalled();
    },
  );
  it("closes the transport when the provider rejects delivery", async () => {
    sendMail.mockResolvedValue({ accepted: [] });
    await expect(
      sendRecoveryEmail("recipient@example.com", "a".repeat(64)),
    ).rejects.toThrow();
    expect(close).toHaveBeenCalled();
  });
});

// SR
