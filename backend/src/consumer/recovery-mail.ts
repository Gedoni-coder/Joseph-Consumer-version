import nodemailer from "nodemailer";

function configuration() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM, PASSWORD_RESET_ORIGIN } =
    process.env;
  const port = Number(process.env.SMTP_PORT || 465);
  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !EMAIL_FROM ||
    !PASSWORD_RESET_ORIGIN ||
    ![465, 587].includes(port) ||
    /[\r\n]/.test(EMAIL_FROM)
  )
    return null;
  try {
    const url = new URL(PASSWORD_RESET_ORIGIN);
    const local =
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname);
    if (
      (!local && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return null;
    return {
      host: SMTP_HOST,
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: EMAIL_FROM,
      port,
      origin: url.origin,
    };
  } catch {
    return null;
  }
}

export const recoveryConfigured = () => configuration() !== null;

export async function sendRecoveryEmail(email: string, token: string) {
  const config = configuration();
  if (!config) throw new Error("Recovery email is not configured");
  // Fragments stay out of HTTP access logs and referrer headers.
  const link = `${config.origin}/#reset-password=${token}`;
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: true,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
  try {
    const result = await transport.sendMail({
      from: config.from,
      to: email,
      subject: "Reset your JOSEPH password",
      text: `A password reset was requested for your JOSEPH account.\n\nChoose a new password:\n${link}\n\nThis link expires in one hour and can be used once. Your existing sessions will be signed out after the password changes.\n\nIf you did not request this, ignore this email. Your password has not changed.\n\nJOSEPH AI`,
    });
    if (!result.accepted?.length) throw new Error("Recovery email rejected");
  } finally {
    transport.close();
  }
}

// SR
