import { useEffect, useState } from "react";
import { CATEGORIES } from "../../backend/src/consumer/progress-rules";
import { api, kobo, money } from "./api";
import { date, ErrorMessage } from "./components";
import { useNotice } from "./useNotice";
import "./progress.css";

type Category = {
  id: string;
  label: string;
  limit: number | null;
  spent: number;
};
type Period = {
  weekStart: string;
  weekEnd: string;
  categories: Category[];
  total: number;
  count: number;
};
type Progress = Period & {
  xp: {
    totalMilli: number;
    weekMilli: number;
    streak: number;
    checkedInToday: boolean;
  };
  previous: Period & { reviewed: boolean; canReview: boolean };
};
const xp = (milli: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 3 }).format(
    milli / 1000,
  );

export function WeeklyProgress({
  planning = false,
  refreshKey,
}: {
  planning?: boolean;
  refreshKey: unknown;
}) {
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useNotice();
  const [busy, setBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  useEffect(() => {
    let active = true;
    api<Progress>("/progress")
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);
  async function reload() {
    try {
      setData(await api<Progress>("/progress"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!data)
    return (
      <section className="panel">
        <h2>{planning ? "Weekly category limits" : "Your weekly progress"}</h2>
        <ErrorMessage message={error} />
        <button className="text-button" onClick={() => void reload()}>
          Load weekly progress
        </button>
      </section>
    );
  return (
    <section
      className="panel weekly-progress"
      aria-label={planning ? "Weekly category limits" : "Your weekly progress"}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {planning ? "PLAN YOUR WEEK" : "SMALL HABITS, STEADY PROGRESS"}
          </p>
          <h2>
            {planning ? "Weekly category limits" : "Your weekly progress"}
          </h2>
        </div>
        <span className="period-label">
          {date(data.weekStart)} – {date(data.weekEnd)} · WAT
        </span>
      </div>
      <ErrorMessage message={error} />
      {notice && (
        <p className="success" role="status">
          {notice}
        </p>
      )}
      {planning ? (
        <>
          <p>
            Choose limits for this week. Leave a field blank for no limit, or
            enter zero to plan no spending in that category.
          </p>
          <form
            key={`${data.weekStart}-${formVersion}`}
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              const values = new FormData(event.currentTarget);
              setBusy(true);
              setError("");
              setNotice("");
              try {
                const budgets = CATEGORIES.filter(
                  (c) => String(values.get(c.id) ?? "").trim() !== "",
                ).map((c) => ({
                  category: c.id,
                  amount: kobo(values.get(c.id)),
                }));
                setData(
                  await api<Progress>("/category-budgets", "PUT", {
                    weekStart: data.weekStart,
                    budgets,
                  }),
                );
                setFormVersion((v) => v + 1);
                setNotice("Your weekly category limits are saved.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="budget-fields">
              {data.categories
                .filter((c) => c.id !== "uncategorized")
                .map((c) => (
                  <label key={c.id}>
                    {c.label}
                    <span className="amount-input">
                      <span aria-hidden="true">₦</span>
                      <input
                        name={c.id}
                        aria-label={c.label}
                        aria-describedby={`budget-spent-${c.id}`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="10000000000"
                        step="0.01"
                        defaultValue={c.limit === null ? "" : c.limit / 100}
                        placeholder="No limit"
                      />
                    </span>
                    <small id={`budget-spent-${c.id}`}>
                      Spent: {money(c.spent)}
                    </small>
                  </label>
                ))}
            </div>
            <p className="note">
              Category limits are comparisons, not extra reserves. They do not
              reduce Safe to Spend or change your daily spending assumption. Set
              fresh limits each Monday.
            </p>
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Save weekly limits"}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="xp-summary">
            <div>
              <span>This week</span>
              <strong data-testid="weekly-xp">
                {xp(data.xp.weekMilli)} <small>XP</small>
              </strong>
            </div>
            <div>
              <span>Current streak</span>
              <strong>
                {data.xp.streak}{" "}
                <small>{data.xp.streak === 1 ? "day" : "days"}</small>
              </strong>
            </div>
            <div>
              <span>Total earned</span>
              <strong>
                {xp(data.xp.totalMilli)} <small>XP</small>
              </strong>
            </div>
          </div>
          <p className="check-in-status">
            {data.xp.checkedInToday
              ? "Today’s check-in is complete."
              : "Record a categorized purchase made today to check in."}
          </p>
          <CategoryBreakdown period={data} />
          <details className="xp-explainer">
            <summary>How Track XP works</summary>
            <p>
              Your first eligible purchase each day earns 6 XP. Each additional
              eligible purchase earns 0.5 XP. Every seven consecutive check-in
              days earns 24 XP. Reviewing the previous completed week earns 12
              XP for that week.
            </p>
            <p>
              Backdated entries and the same amount logged again within 60
              seconds do not earn XP. Purchases still count toward your
              spending. Removing a purchase also corrects its XP and any
              affected streak or review award.
            </p>
            <p className="note">
              XP recognises recording habits, not how much you spend. No
              purchase? There is no need to buy something to keep a streak.
              Weeks run Monday to Sunday in West Africa Time.
            </p>
          </details>
          {data.previous.count > 0 && (
            <div className="weekly-review">
              <button
                className="text-button"
                aria-expanded={reviewOpen}
                onClick={() => setReviewOpen(!reviewOpen)}
              >
                {reviewOpen
                  ? "Close last week’s summary"
                  : "Review last week’s spending"}
              </button>
              {reviewOpen && (
                <div>
                  <h3>
                    {date(data.previous.weekStart)} –{" "}
                    {date(data.previous.weekEnd)}
                  </h3>
                  <CategoryBreakdown period={data.previous} />
                  {data.previous.reviewed ? (
                    <p role="status">Weekly review completed.</p>
                  ) : data.previous.canReview ? (
                    <button
                      className="button"
                      disabled={busy}
                      onClick={async () => {
                        if (busy) return;
                        setBusy(true);
                        setError("");
                        try {
                          setData(
                            await api<Progress>("/weekly-review", "POST", {
                              weekStart: data.previous.weekStart,
                            }),
                          );
                          setNotice(
                            "Weekly review complete. 12 XP added to last week.",
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy ? "Saving…" : "Mark reviewed · 12 XP"}
                    </button>
                  ) : (
                    <p className="note">
                      No eligible check-ins were recorded in this week. You can
                      still review your spending.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
function CategoryBreakdown({ period }: { period: Period }) {
  const categories = period.categories.filter(
    (c) => c.spent > 0 || c.limit !== null,
  );
  return (
    <div className="category-breakdown">
      <div className="section-heading">
        <h3>Spending by category</h3>
        <strong>
          {money(period.total)} <small>recorded</small>
        </strong>
      </div>
      {categories.length ? (
        categories.map((c) => (
          <div className="category-row" key={c.id}>
            <div>
              <span>{c.label}</span>
              <strong>
                {money(c.spent)}
                {c.limit !== null && <small> / {money(c.limit)}</small>}
              </strong>
            </div>
            {c.limit !== null && (
              <>
                <progress
                  aria-label={`${c.label} budget used`}
                  max={c.limit || 1}
                  value={Math.min(c.spent, c.limit || 1)}
                />
                <span className={c.spent > c.limit ? "over-budget" : "note"}>
                  {c.spent > c.limit
                    ? `${money(c.spent - c.limit)} over limit`
                    : `${money(c.limit - c.spent)} left`}
                </span>
              </>
            )}
          </div>
        ))
      ) : (
        <p className="note">
          Your category totals will appear here after your first purchase. Add
          weekly limits in Plan to compare your spending.
        </p>
      )}
    </div>
  );
}
// SR
