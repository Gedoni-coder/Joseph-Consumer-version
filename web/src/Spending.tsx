import { useEffect, useRef, useState } from "react";
import { api, kobo, money, type Dashboard } from "./api";
import { Amount, date, ErrorMessage } from "./components";
type Purchase = {
  id: string;
  label: string;
  amount: number;
  occurredOn: string;
};
type History = { purchases: Purchase[]; nextOffset: number | null };
const today = () => new Date(Date.now() + 3600000).toISOString().slice(0, 10);

export function BurnRate({
  spending,
  planned,
}: {
  spending: Dashboard["spending"];
  planned: number;
}) {
  const rate = spending.daily;
  const ceiling = Math.max(
    planned * 2,
    rate === null ? 0 : Math.ceil(rate / 100000) * 100000,
    100000,
  );
  const ratio = Math.min(1, Math.max(0, (rate ?? 0) / ceiling));
  const angle = -90 + ratio * 180;
  const short = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value / 100);
  return (
    <section className="panel burn-card" aria-labelledby="burn-heading">
      <div>
        <p className="eyebrow">YOUR SPENDING PACE</p>
        <h2 id="burn-heading">Burn rate</h2>
        <p>Total recorded spending divided by elapsed calendar days.</p>
      </div>
      <div className="burn-dial">
        <svg
          viewBox="0 0 300 174"
          role="img"
          aria-label={
            rate === null
              ? "No recorded purchases yet"
              : `Burn rate ${money(rate)} per day. Scale zero to ${money(ceiling)} per day.`
          }
        >
          <path d="M 32 140 A 118 118 0 0 1 268 140" className="dial-track" />
          <path
            d="M 32 140 A 118 118 0 0 1 268 140"
            className="dial-progress"
            pathLength="100"
            strokeDasharray={`${ratio * 100} 100`}
          />
          {Array.from({ length: 11 }, (_, i) => {
            const a = Math.PI - (i * Math.PI) / 10;
            return (
              <line
                key={i}
                x1={150 + Math.cos(a) * 103}
                y1={140 - Math.sin(a) * 103}
                x2={150 + Math.cos(a) * (i % 5 === 0 ? 91 : 97)}
                y2={140 - Math.sin(a) * (i % 5 === 0 ? 91 : 97)}
                stroke="#858ca7"
                strokeWidth={i % 5 === 0 ? 2 : 1}
              />
            );
          })}
          {rate !== null && (
            <g
              className="dial-needle"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <path d="M146 140 L150 54 L154 140 Z" fill="#03031d" />
            </g>
          )}
          <circle cx="150" cy="140" r="7" fill="#03031d" />
          <text x="28" y="167" textAnchor="middle">
            ₦0
          </text>
          <text x="150" y="41" textAnchor="middle">
            ₦{short(ceiling / 2)}
          </text>
          <text x="272" y="167" textAnchor="middle">
            ₦{short(ceiling)}
          </text>
        </svg>
        <strong
          className="burn-value"
          data-testid="burn-rate"
          aria-live="polite"
        >
          {rate === null ? "—" : money(rate)}
          <small>/day</small>
        </strong>
        <span className="burn-unit">Naira / day</span>
      </div>
      <div className="burn-context">
        <strong>
          {rate === null
            ? "Your spending history starts here."
            : `${money(spending.total)} ÷ ${spending.days} ${spending.days === 1 ? "day" : "days"}`}
        </strong>
        <p>
          {rate === null
            ? "Record a purchase below to start tracking your pace."
            : `${date(spending.from)} – ${date(spending.to)} · ${spending.count} ${spending.count === 1 ? "purchase" : "purchases"}`}
        </p>
        <p>
          {planned > 0
            ? `Your planned everyday spending is ${money(planned)}/day.`
            : "Set your everyday spending in Plan to add a comparison."}
        </p>
        <span className="note">
          From your first recorded purchase through today, including days with
          no spending. Bank transactions are not imported yet.
        </span>
      </div>
    </section>
  );
}

export function SpendingHistory({ changed }: { changed: () => Promise<void> }) {
  const [history, setHistory] = useState<History | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const reload = async () => setHistory(await api<History>("/purchases"));
  useEffect(() => {
    void reload().catch((e) => setError(e.message));
  }, []);
  return (
    <section
      className="panel spending-history"
      aria-labelledby="spending-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">EVERY PURCHASE, IN VIEW</p>
          <h2 id="spending-heading">Spending history</h2>
        </div>
        <button
          className="button small"
          aria-expanded={open}
          aria-controls="record-purchase"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close form" : "+ Record purchase"}
        </button>
      </div>
      <p>Your recorded purchases, newest first.</p>
      {open && (
        <form
          id="record-purchase"
          className="purchase-entry"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const form = event.currentTarget;
            const values = new FormData(form);
            setBusy(true);
            setError("");
            setNotice("");
            try {
              await api("/purchases", "POST", {
                requestId: requestId.current,
                label: String(values.get("label")).trim(),
                amount: kobo(values.get("amount")),
                occurredOn: values.get("occurredOn"),
              });
              requestId.current = crypto.randomUUID();
              form.reset();
              setOpen(false);
              await reload();
              await changed();
              setNotice("Purchase recorded. Your burn rate is updated.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Purchase
            <input
              name="label"
              required
              maxLength={80}
              placeholder="e.g. Groceries"
            />
          </label>
          <Amount label="Amount spent" name="amount" />
          <label>
            Purchase date
            <input
              type="date"
              name="occurredOn"
              required
              min="1900-01-01"
              max={today()}
              defaultValue={today()}
            />
          </label>
          <p className="note">
            This adds to your history and burn rate. It does not change your
            balances. If this purchase is not reflected in your available
            balance, update it in Manage.
          </p>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save purchase"}
          </button>
        </form>
      )}
      <ErrorMessage message={error} />
      {notice && (
        <p className="success" role="status">
          {notice}
        </p>
      )}
      {!history ? (
        <button
          className="text-button"
          onClick={() => reload().catch((e) => setError(e.message))}
        >
          Load spending history
        </button>
      ) : history.purchases.length ? (
        <>
          <div className="history-scroll">
            <table>
              <caption className="sr-only">
                Recorded spending: amount, purchase and date
              </caption>
              <thead>
                <tr>
                  <th scope="col">Amount</th>
                  <th scope="col">Purchase</th>
                  <th scope="col">Date</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="history-amount">{money(p.amount)}</td>
                    <td>{p.label}</td>
                    <td>
                      <time dateTime={p.occurredOn}>{date(p.occurredOn)}</time>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        disabled={busy}
                        aria-label={`Delete purchase ${p.label}`}
                        onClick={async () => {
                          if (
                            !confirm(
                              `Remove ${p.label} from your spending history?`,
                            )
                          )
                            return;
                          setBusy(true);
                          setError("");
                          try {
                            await api("/purchases/" + p.id, "DELETE", {});
                            await reload();
                            await changed();
                            setNotice(
                              "Purchase removed. Your burn rate is updated.",
                            );
                          } catch (e) {
                            setError((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"
                            stroke="currentColor"
                            fill="none"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.nextOffset !== null && (
            <button
              className="text-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const next = await api<History>(
                    "/purchases?offset=" + history.nextOffset,
                  );
                  setHistory({
                    purchases: [...history.purchases, ...next.purchases],
                    nextOffset: next.nextOffset,
                  });
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Load older purchases
            </button>
          )}
        </>
      ) : (
        <div className="empty-copy">
          No purchases recorded yet. Add your first purchase to build your
          history.
        </div>
      )}
    </section>
  );
}
