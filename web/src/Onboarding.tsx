import { useState, type FormEvent } from "react";
import { api, kobo } from "./api";
import { Amount, Arrow, ErrorMessage } from "./components";

type Entry = { id: number; kind: "bill" | "goal" };
export function Onboarding({ done }: { done: () => Promise<void> }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/onboarding", "POST", {
        accepted: true,
        version: "manual-planning-2026-10-16",
        daily: kobo(form.get("daily")),
        reserve: kobo(form.get("reserve")),
        horizon: Number(form.get("horizon")),
        cashBalance:
          String(form.get("cash") || "").trim() === ""
            ? null
            : kobo(form.get("cash")),
        commitments: entries.map((entry) => ({
          kind: entry.kind,
          label: form.get(`label-${entry.id}`),
          amount: kobo(form.get(`amount-${entry.id}`)),
          dueDate: form.get(`date-${entry.id}`),
        })),
      });
      await done();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="onboarding">
      <ol className="signup-progress" aria-label="Signup progress">
        <li>
          1 <span>Your details ✓</span>
        </li>
        <li aria-current="step">
          2 <span>Your money plan</span>
        </li>
      </ol>
      <div className="page-heading">
        <div>
          <p className="eyebrow">STEP 2 OF 2</p>
          <h1>Let's set up your plan.</h1>
          <p>
            A few answers now will fill in your spending plan, balances, bills
            and goals. You can change them later.
          </p>
        </div>
      </div>
      <form onSubmit={submit}>
        <fieldset className="panel setup-section">
          <legend>01 / Your everyday money</legend>
          <h2>What does a normal day cost?</h2>
          <p>
            Include things like food and transport. Leave out the bills you add
            below so they aren't counted twice.
          </p>
          <div className="setup-fields">
            <Amount name="daily" label="Everyday spending per day" />
            <Amount name="reserve" label="Minimum safety buffer" />
          </div>
          <p className="note">
            Your buffer is the amount you want to keep untouched. Enter 0 if you
            don't want one.
          </p>
          <label>
            How far ahead do you want to plan?
            <select name="horizon" defaultValue="30">
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </label>
          <label>
            Cash or money you will not connect (optional)
            <span className="amount-input">
              <span aria-hidden="true">₦</span>
              <input
                name="cash"
                type="number"
                inputMode="decimal"
                min="0"
                max="10000000000"
                step="0.01"
              />
            </span>
          </label>
          <p className="note">
            Only include money you can spend. Leave this blank if you want to
            add balances later.
          </p>
        </fieldset>
        <fieldset className="panel setup-section">
          <legend>02 / What needs to be covered?</legend>
          <h2>Bills first. Then your goals.</h2>
          <p>
            Add the next payment for each commitment. The amounts and dates will
            appear in Bills &amp; goals automatically.
          </p>
          <datalist id="bill-templates">
            <option value="Rent" />
            <option value="School fees" />
            <option value="Electricity" />
            <option value="Internet" />
            <option value="Loan repayment" />
            <option value="Family support" />
          </datalist>
          <datalist id="goal-templates">
            <option value="Emergency fund contribution" />
            <option value="New laptop" />
            <option value="Travel savings" />
            <option value="Business savings" />
          </datalist>
          {entries.map((entry, index) => (
            <div className="setup-entry" key={entry.id}>
              <div className="setup-entry-heading">
                <strong>
                  {entry.kind === "bill" ? "Bill" : "Goal"} {index + 1}
                </strong>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setEntries((rows) => rows.filter((r) => r.id !== entry.id))
                  }
                >
                  Remove <span className="sr-only">entry {index + 1}</span>
                </button>
              </div>
              <label>
                What is it for?
                <input
                  name={`label-${entry.id}`}
                  required
                  maxLength={80}
                  list={
                    entry.kind === "bill" ? "bill-templates" : "goal-templates"
                  }
                />
              </label>
              <div className="setup-fields">
                <Amount
                  name={`amount-${entry.id}`}
                  label="Amount to set aside"
                />
                <label>
                  Next payment date
                  <input type="date" name={`date-${entry.id}`} required />
                </label>
              </div>
            </div>
          ))}
          <div className="setup-actions">
            <button
              type="button"
              className="button secondary"
              disabled={entries.length >= 20}
              onClick={() =>
                setEntries((rows) => [
                  ...rows,
                  { id: Date.now(), kind: "bill" },
                ])
              }
            >
              + Add a bill
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={entries.length >= 20}
              onClick={() =>
                setEntries((rows) => [
                  ...rows,
                  { id: Date.now(), kind: "goal" },
                ])
              }
            >
              + Add a goal
            </button>
          </div>
          {!entries.length && (
            <p className="note">
              Nothing due yet? You can add these from your dashboard whenever
              you need to.
            </p>
          )}
        </fieldset>
        <section className="panel setup-section">
          <h2>Save your plan. Stay in control.</h2>
          <p>
            JOSEPH stores these entries on its servers to calculate your
            personal forecast. Results are estimates from your answers. You can
            export your data, withdraw consent or delete your account in
            Privacy.
          </p>
          <label className="checkbox">
            <input type="checkbox" required />I agree to the storage and use of
            my entries for this money plan.
          </label>
          <p className="note">
            Next, you can connect a bank through Mono's sandbox. Bank connection
            has its own consent and can be skipped.
          </p>
          <ErrorMessage message={error} />
          <button className="button" disabled={busy}>
            {busy ? "Saving your plan…" : "Save plan and continue"} <Arrow />
          </button>
        </section>
      </form>
    </section>
  );
}

// SR
