import { useState, type FormEvent } from "react";
import { api } from "./api";
import { Brand, ErrorMessage, Note } from "./components";

export function PasswordRecovery({
  token,
  back,
  requestNew,
}: {
  token: string | null;
  back: () => void;
  requestNew: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const resetting = token !== null;
  const validToken = token !== null && /^[a-f0-9]{64}$/.test(token);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") || "");
    setError("");
    if (resetting && password !== form.get("confirmPassword")) {
      setError("The passwords do not match.");
      return;
    }
    if (resetting && new TextEncoder().encode(password).length > 72) {
      setError(
        "Use a password of at most 72 bytes. Some characters use more than one byte.",
      );
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ message: string }>(
        resetting ? "/reset-password" : "/forgot-password",
        "POST",
        resetting
          ? { token, password }
          : { email: String(form.get("email")).trim() },
      );
      formElement.reset();
      setNotice(result.message);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <aside>
        <Brand />
        <div>
          <p className="eyebrow">ACCOUNT ACCESS</p>
          <h1>
            Your plans.
            <br />
            <em>Right where you left them.</em>
          </h1>
          <p>Reset your password to get back to your money plan.</p>
        </div>
        <span>JOSEPH AI</span>
      </aside>
      <section>
        <button className="text-button back" onClick={back} disabled={busy}>
          ← Back to sign in
        </button>
        <div className="auth-form">
          <p className="eyebrow">PASSWORD RECOVERY</p>
          <h2>
            {notice
              ? resetting
                ? "Password changed."
                : "Check your email."
              : resetting
                ? "Choose a new password."
                : "Forgot your password?"}
          </h2>
          {notice ? (
            <>
              <p role="status">{notice}</p>
              {!resetting && (
                <Note>
                  The link expires in one hour. If it has not arrived, check
                  your spam folder and wait a minute before trying again.
                </Note>
              )}
              <button className="button full" onClick={back}>
                Back to sign in
              </button>
              {!resetting && (
                <button className="text-button" onClick={() => setNotice("")}>
                  Try another email or resend
                </button>
              )}
            </>
          ) : resetting && !validToken ? (
            <>
              <ErrorMessage message="This reset link is incomplete or invalid. Request a new link." />
              <button className="button full" onClick={requestNew}>
                Request a new link
              </button>
            </>
          ) : (
            <>
              <p>
                {resetting
                  ? "Your other signed-in sessions will end when you save your new password."
                  : "Enter the email address you used to create your JOSEPH account."}
              </p>
              <form onSubmit={submit}>
                {resetting ? (
                  <>
                    <label>
                      New password
                      <input
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={72}
                        pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
                        title="At least 8 characters, with an uppercase letter, a lowercase letter and a number"
                      />
                    </label>
                    <label>
                      Confirm new password
                      <input
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        maxLength={72}
                      />
                    </label>
                    <Note>
                      Use at least 8 characters, including an uppercase letter,
                      a lowercase letter and a number.
                    </Note>
                  </>
                ) : (
                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                    />
                  </label>
                )}
                <ErrorMessage message={error} />
                <button className="button full" disabled={busy}>
                  {busy
                    ? "One moment…"
                    : resetting
                      ? "Save new password"
                      : "Send reset link"}
                </button>
              </form>
              {resetting && (
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={requestNew}
                >
                  Request a new link
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

// SR
