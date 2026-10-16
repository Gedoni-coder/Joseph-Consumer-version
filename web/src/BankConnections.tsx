import { useEffect, useRef, useState } from "react";
import { api, money } from "./api";
import { Arrow, ErrorMessage } from "./components";
type Bank = {
  id: string;
  bankName: string;
  accountName: string;
  last4: string;
  currency: string;
  balance: number | null;
  status: string;
  sandbox: boolean;
  syncedAt: string | null;
};
type Banks = {
  configured: boolean;
  sandbox: boolean;
  consentVersion: string;
  banks: Bank[];
};
export function BankConnections({ finish }: { finish?: () => void }) {
  const [data, setData] = useState<Banks | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const cleanup = useRef<() => void>(() => {});
  async function reload() {
    setData(await api<Banks>("/banks"));
  }
  useEffect(() => {
    reload().catch((e) => setError(e.message));
    return () => cleanup.current();
  }, []);
  async function action(operation: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      await reload();
      setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    if (!data || !accepted || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const session = await api<{
        sessionId: string;
        publicKey: string;
        customer: { name: string; email: string };
      }>("/banks/session", "POST", {
        accepted: true,
        version: data.consentVersion,
      });
      const { default: Connect } = await import("@mono.co/connect.js");
      let completing = false;
      const guard = (event: MessageEvent) => {
        if (
          !event.isTrusted ||
          typeof event.data?.type !== "string" ||
          !event.data.type.startsWith("mono.")
        )
          return;
        const frame = document.getElementById(
          "mono-connect--frame-id",
        ) as HTMLIFrameElement | null;
        if (
          event.origin !== "https://connect.mono.co" ||
          event.source !== frame?.contentWindow
        )
          event.stopImmediatePropagation();
      };
      window.addEventListener("message", guard, true);
      const widget = new Connect({
        key: session.publicKey,
        scope: "auth",
        reference: session.sessionId,
        data: { customer: session.customer, meta: { ref: session.sessionId } },
        onClose: () => {
          window.removeEventListener("message", guard, true);
          if (!completing) setBusy(false);
        },
        onSuccess: ({ code }) => {
          if (completing) return;
          completing = true;
          void action(
            () =>
              api("/banks/exchange", "POST", {
                sessionId: session.sessionId,
                code,
              }),
            "Bank connection saved. Test balances appear below when Mono finishes processing.",
          );
        },
      });
      cleanup.current = () => {
        window.removeEventListener("message", guard, true);
        widget.close();
      };
      widget.setup();
      widget.open();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <section className="panel bank-connections">
      <p className="eyebrow">
        {finish ? "YOUR PLAN IS SAVED · CONNECT A BANK" : "CONNECTED BANKS"}
      </p>
      <h2>Bring your bank into the picture.</h2>
      <div className="sandbox-notice">
        <strong>Mono sandbox · testing only</strong>
        <p>
          Use the test credentials shown by Mono, never your real banking
          password. Imported test balances are kept separate and do not increase
          your Safe-to-Spend.
        </p>
      </div>
      <p>
        Mono handles bank sign-in on its secure interface. JOSEPH receives
        account details and balances, never your bank password or PIN. No money
        is moved.
      </p>
      {data?.banks.map((bank) => (
        <article className="bank-row" key={bank.id}>
          <div>
            <h3>
              {bank.bankName}
              {bank.last4 ? ` · •••• ${bank.last4}` : ""}
            </h3>
            <p>{bank.accountName}</p>
            <span className="status-pill">
              {bank.status === "connected"
                ? "Sandbox connected"
                : bank.status === "disconnecting"
                  ? "Disconnect pending — retry below"
                  : bank.status === "processing"
                    ? "Waiting for bank data"
                    : "Data unavailable — try refreshing"}
            </span>
            {bank.balance !== null && (
              <strong className="bank-balance">
                {money(bank.balance)} <small>test balance</small>
              </strong>
            )}
            {bank.syncedAt && (
              <p className="note">
                Retrieved {new Date(bank.syncedAt).toLocaleString("en-NG")}
              </p>
            )}
          </div>
          <div className="setup-actions">
            <button
              className="text-button"
              disabled={busy || bank.status === "disconnecting"}
              onClick={() =>
                action(
                  () => api(`/banks/${bank.id}/refresh`, "POST", {}),
                  "Bank status refreshed.",
                )
              }
            >
              Refresh <span className="sr-only">{bank.bankName}</span>
            </button>
            <button
              className="text-button danger"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Disconnect this bank and remove its imported data from JOSEPH?",
                  )
                )
                  void action(
                    () => api(`/banks/${bank.id}`, "DELETE", {}),
                    "Bank disconnected and its imported data removed.",
                  );
              }}
            >
              Disconnect <span className="sr-only">{bank.bankName}</span>
            </button>
          </div>
        </article>
      ))}
      <ErrorMessage message={error} />
      {notice && (
        <p className="success" role="status">
          {notice}
        </p>
      )}
      {!data && (
        <button
          className="text-button"
          disabled={busy}
          onClick={() => action(reload, "")}
        >
          Retry bank status
        </button>
      )}
      {data?.configured ? (
        <>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            I agree to share and store my connected account details and balances
            through Mono for this test. I can disconnect and delete this data at
            any time.
          </label>
          <button
            className="button"
            disabled={!accepted || busy}
            onClick={connect}
          >
            {busy ? "Connecting…" : "Connect a test bank"} <Arrow />
          </button>
        </>
      ) : (
        data && (
          <p className="note">
            Bank testing is not available in this environment. Your saved plan
            still works.
          </p>
        )
      )}
      {finish && (
        <button className="button secondary" disabled={busy} onClick={finish}>
          {data?.banks.length
            ? "Go to my dashboard"
            : "Continue without a bank"}
        </button>
      )}
    </section>
  );
}
