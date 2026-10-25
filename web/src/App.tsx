import { useEffect, useRef, useState } from "react";
import { BurnRate, SpendingHistory } from "./Spending";
import { Onboarding } from "./Onboarding";
import { BankConnections } from "./BankConnections";
import { PasswordRecovery } from "./PasswordRecovery";
import { api, kobo, money, type Dashboard, type State, type User } from "./api";
import {
  Amount,
  Arrow,
  Auth,
  Brand,
  Consent,
  date,
  ErrorMessage,
  Landing,
  Note,
  Projection,
} from "./components";
import type {
  AccountInput,
  CommitmentInput,
} from "../../backend/src/consumer/engine";
type Page = "overview" | "accounts" | "commitments" | "plan" | "privacy";
function Workspace({
  initialUser,
  signedOut,
}: {
  initialUser: User;
  signedOut: () => void;
}) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [page, setPage] = useState<Page>("overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState<AccountInput | null>(null);
  const [commitment, setCommitment] = useState<CommitmentInput | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [simulation, setSimulation] = useState<State | null>(null);
  const [connectAfterSetup, setConnectAfterSetup] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const refresh = async () => setData(await api<Dashboard>("/dashboard"));
  useEffect(() => {
    refresh().catch((error) => setError(error.message));
  }, []);
  async function run(
    action: () => Promise<unknown>,
    message: string,
    reload = true,
  ) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      if (reload) {
        await refresh();
        setSimulation(null);
      }
      setNotice(message);
      return true;
    } catch (error) {
      setError((error as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function navigate(next: Page) {
    menu.current?.close();
    setPage(next);
    setError("");
    setNotice("");
  }
  const tabs: { id: Page; name: string; icon: string }[] = [
    { id: "overview", name: "Track", icon: "◫" },
    { id: "accounts", name: "Manage", icon: "◉" },
    { id: "commitments", name: "Bills & goals", icon: "◎" },
    { id: "plan", name: "Plan", icon: "≋" },
  ];
  const state = data?.state;
  return (
    <div className="workspace">
      <dialog
        className="workspace-drawer"
        ref={menu}
        id="workspace-menu"
        aria-label="Workspace menu"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) menu.current?.close();
        }}
      >
        <aside className="sidebar">
          <button
            className="drawer-close text-button"
            autoFocus
            aria-label="Close menu"
            onClick={() => menu.current?.close()}
          >
            ×
          </button>
          <Brand />
          <p className="eyebrow">YOUR LITTLE CORNER</p>
          <nav aria-label="Your workspace">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                aria-current={page === tab.id ? "page" : undefined}
                onClick={() => navigate(tab.id)}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
          <button
            className="privacy-nav"
            aria-current={page === "privacy" ? "page" : undefined}
            onClick={() => navigate("privacy")}
          >
            <span aria-hidden="true">◇</span> Privacy &amp; account
          </button>
          <div className="sidebar-bottom">
            <div className="avatar">
              {initialUser.name?.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{initialUser.name}</strong>
              <small>Personal account</small>
            </div>
            <button
              className="text-button"
              aria-label="Sign out"
              disabled={busy}
              onClick={() =>
                run(
                  async () => {
                    await api("/logout", "POST", {});
                    signedOut();
                  },
                  "",
                  false,
                )
              }
            >
              ↪
            </button>
          </div>
        </aside>
      </dialog>
      <main className="app-main">
        <header className="app-header">
          <div className="workspace-brand">
            <button
              className="menu-toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="workspace-menu"
              onClick={() => {
                menu.current?.showModal();
                setMenuOpen(true);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                aria-hidden="true"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <Brand />
          </div>
          <span className="status-pill">Manual planning</span>
        </header>
        <ErrorMessage message={error} />
        {notice && (
          <p className="success" role="status">
            {notice}
          </p>
        )}
        {!data ? (
          <section className="panel">
            <h1>Opening your money picture…</h1>
            <button
              className="text-button"
              onClick={() => run(refresh, "", false)}
            >
              Retry loading
            </button>
          </section>
        ) : data.requiresOnboarding && page !== "privacy" ? (
          <Onboarding
            done={async () => {
              await refresh();
              setConnectAfterSetup(true);
            }}
          />
        ) : connectAfterSetup && page !== "privacy" ? (
          <BankConnections
            finish={() => {
              setConnectAfterSetup(false);
              navigate("overview");
            }}
          />
        ) : !data.consent && page !== "privacy" ? (
          <Consent
            busy={busy}
            save={() =>
              run(
                () =>
                  api("/consent", "POST", {
                    accepted: true,
                    version: "manual-planning-2026-10-16",
                  }),
                "Your choice has been saved.",
              )
            }
          />
        ) : (
          <>
            {page === "overview" && state && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">A MOMENT OF CLARITY</p>
                    <h1>
                      Hello, {initialUser.name?.split(" ")[0]}.<br />
                      <em>Let’s see where you stand.</em>
                    </h1>
                  </div>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      run(refresh, "Your picture is up to date.", false)
                    }
                  >
                    ↻ Refresh
                  </button>
                </div>
                {(!data.inputs.accounts.length ||
                  !data.inputs.planConfirmed) && (
                  <section className="setup-strip">
                    <div>
                      <strong>Your picture starts with you.</strong>
                      <p>
                        Add a balance and confirm a spending plan to calculate
                        your first estimate.
                      </p>
                    </div>
                    <button
                      className="button small"
                      onClick={() =>
                        navigate(
                          !data.inputs.accounts.length ? "accounts" : "plan",
                        )
                      }
                    >
                      {!data.inputs.accounts.length
                        ? "Add a balance"
                        : "Set my spending plan"}{" "}
                      <Arrow />
                    </button>
                  </section>
                )}
                <div className="summary-grid">
                  <section className="spend-card">
                    <div>
                      <span>Safe to spend today</span>
                      <span className="status-pill">
                        {state.confidence === "restricted"
                          ? "More information needed"
                          : "Estimate"}
                      </span>
                    </div>
                    <strong data-testid="safe-to-spend">
                      {money(state.safeToSpend)}
                      <small className="daily-unit">/day</small>
                    </strong>
                    <p>
                      {state.safeToSpend === null
                        ? state.reasons.includes("BALANCE_STALE")
                          ? "Update your balances. They were last confirmed more than 24 hours ago."
                          : "Add current balances and confirm your spending plan first."
                        : `Daily allowance across your next ${state.horizon} days, after setting aside bills, goals and your buffer.`}
                    </p>
                    <span className="spend-foot">
                      Based on your entries · No future income assumed
                    </span>
                  </section>
                  <BurnRate spending={data.spending} planned={state.daily} />
                  <section className="panel runway-card">
                    <p className="eyebrow">PROJECTED RUNWAY</p>
                    <strong data-testid="projected-runway">
                      {state.runwayDays === null
                        ? "—"
                        : new Intl.NumberFormat("en-NG", {
                            maximumFractionDigits: 1,
                          }).format(state.runwayDays)}
                      <small>days</small>
                    </strong>
                    <p>
                      {state.confidence === "restricted"
                        ? "Confirm current balances and your spending plan to see your runway."
                        : state.runwayDays === null
                          ? "Record spending to estimate your runway. A zero burn rate has no finite estimate."
                          : "Remaining balance ÷ average daily burn rate. Future bills and income are not included in this ratio."}
                    </p>
                    <button
                      className="text-button"
                      onClick={() => navigate("plan")}
                    >
                      Review my assumptions <Arrow />
                    </button>
                  </section>
                </div>
                <div className="stats-row">
                  <div>
                    <span>Available balances</span>
                    <strong>{money(state.liquid)}</strong>
                  </div>
                  <div>
                    <span>Reserved in your plan</span>
                    <strong>{money(state.protectedCash)}</strong>
                  </div>
                  <div>
                    <span>Everyday spending</span>
                    <strong>
                      {money(state.daily)}
                      <small> / day</small>
                    </strong>
                  </div>
                </div>
                {state.shortfall > 0 && (
                  <div className="warning">
                    Your plan has a projected shortfall of{" "}
                    {money(state.shortfall)}. Review your commitments and daily
                    spending before adding a purchase.
                  </div>
                )}
                <div className="content-grid">
                  <section className="panel">
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">THE ROAD AHEAD</p>
                        <h2>Your money over time.</h2>
                      </div>
                      <span>{state.horizon} days</span>
                    </div>
                    {state.confidence === "restricted" ? (
                      <div className="empty-state">
                        <span>↗</span>
                        <h3>
                          A forecast worth relying on starts with current
                          inputs.
                        </h3>
                        <p>
                          Confirm your balance and spending plan to see your
                          projection.
                        </p>
                      </div>
                    ) : (
                      <Projection state={state} />
                    )}
                    <details>
                      <summary>What goes into this estimate?</summary>
                      <p>
                        Available cash, minus your confirmed daily spending and
                        each bill or goal contribution on its due date. Overdue
                        items are reserved today. Your buffer must remain
                        available every day.
                      </p>
                      <p>
                        Balances are self-reported. Future income and bank
                        transactions are not connected. Recorded purchases do
                        not automatically change balances. This forecast can
                        change when you update your entries.
                      </p>
                      <p>
                        Calculated{" "}
                        {new Date(state.generatedAt).toLocaleString("en-NG")}.
                        Rule {state.rulesVersion}.
                      </p>
                    </details>
                  </section>
                  <section className="panel purchase">
                    <p className="eyebrow">BEFORE YOU SAY YES</p>
                    <h2>Does it fit your plan?</h2>
                    <p>
                      Check a purchase against the same bills, goals and buffer.
                    </p>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        run(
                          async () =>
                            setSimulation(
                              await api<State>("/simulate", "POST", {
                                amount: kobo(form.get("amount")),
                              }),
                            ),
                          "",
                          false,
                        );
                      }}
                    >
                      <Amount label="Purchase amount" name="amount" />
                      <button className="button full" disabled={busy}>
                        Check this purchase <Arrow />
                      </button>
                    </form>
                    {simulation && (
                      <div
                        className={
                          simulation.scenario.affordable
                            ? "scenario positive"
                            : "scenario caution"
                        }
                        role="status"
                      >
                        <strong>
                          {simulation.scenario.affordable === null
                            ? "Update your inputs first."
                            : simulation.scenario.affordable
                              ? "This fits your current plan."
                              : "This would stretch your plan."}
                        </strong>
                        <p>
                          {simulation.scenario.affordable === null
                            ? "There is not enough current information for an answer."
                            : `After ${money(simulation.scenario.purchase)}, your daily allowance would be ${money(simulation.scenario.afterSafeToSpend)}/day.`}
                        </p>
                        {simulation.scenario.affordable !== null && (
                          <p>
                            Projected runway:{" "}
                            {simulation.scenario.afterRunwayDays === null
                              ? "unavailable"
                              : new Intl.NumberFormat("en-NG", {
                                  maximumFractionDigits: 1,
                                }).format(simulation.scenario.afterRunwayDays)}
                            {simulation.scenario.afterRunwayDays === null
                              ? "."
                              : " days."}
                            {simulation.scenario.shortfall > 0
                              ? ` Shortfall: ${money(simulation.scenario.shortfall)}.`
                              : ""}
                          </p>
                        )}
                        <Note>
                          This check does not record a purchase or change your
                          balances.
                        </Note>
                      </div>
                    )}
                  </section>
                </div>
                <SpendingHistory changed={refresh} />
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">ALREADY SPOKEN FOR</p>
                      <h2>Coming up in your plan.</h2>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("commitments")}
                    >
                      Manage <Arrow />
                    </button>
                  </div>
                  {state.due.length ? (
                    <div className="item-list">
                      {state.due.map((item) => (
                        <div key={item.id} className="item">
                          <span className="item-icon">
                            {item.kind === "goal" ? "◎" : "↗"}
                          </span>
                          <div>
                            <strong>{item.label}</strong>
                            <small>
                              {date(item.dueDate)} ·{" "}
                              {item.kind === "goal"
                                ? "Goal contribution"
                                : "Bill"}
                            </small>
                          </div>
                          <strong>{money(item.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-copy">
                      No dated commitments within this horizon. Add your bills
                      and goal contributions to make the estimate more complete.
                    </p>
                  )}
                </section>
              </>
            )}
            {page === "accounts" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">START WITH WHAT’S AVAILABLE</p>
                    <h1>Your balances.</h1>
                    <p>
                      Enter money you can actually spend. Keep credit limits and
                      inaccessible savings out.
                    </p>
                  </div>
                </div>
                <div className="content-grid">
                  <section className="panel">
                    <h2>Available money</h2>
                    {data.inputs.accounts.length ? (
                      data.inputs.accounts.map((item) => (
                        <div className="item account-item" key={item.id}>
                          <span className="item-icon">◉</span>
                          <div>
                            <strong>{item.label}</strong>
                            <small>
                              Confirmed{" "}
                              {new Date(item.confirmedAt).toLocaleString(
                                "en-NG",
                              )}
                            </small>
                            <strong>{money(item.balance)}</strong>
                          </div>
                          <div className="item-actions">
                            <button
                              className="text-button"
                              onClick={() => {
                                setAccount(item);
                                setFormVersion((value) => value + 1);
                              }}
                            >
                              Update
                              <span className="sr-only"> {item.label}</span>
                            </button>
                            <button
                              className="text-button danger"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove ${item.label} from your plan?`,
                                  )
                                )
                                  run(
                                    () =>
                                      api("/accounts/" + item.id, "DELETE", {}),
                                    "Balance removed.",
                                  );
                              }}
                            >
                              Remove
                              <span className="sr-only"> {item.label}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <span>◉</span>
                        <h3>Make it your own.</h3>
                        <p>
                          Add your first available balance. Nothing is
                          pre-filled.
                        </p>
                      </div>
                    )}
                    <Note>
                      Self-reported balances expire after 24 hours for spending
                      estimates. Update each balance to confirm it is still
                      current. Avoid entering the same account twice.
                    </Note>
                  </section>
                  <section className="panel">
                    <h2>{account ? "Update balance" : "Add a balance"}</h2>
                    <form
                      key={formVersion}
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        run(async () => {
                          await api(
                            "/accounts" + (account ? "/" + account.id : ""),
                            account ? "PUT" : "POST",
                            {
                              label: form.get("label"),
                              balance: kobo(form.get("balance")),
                            },
                          );
                          setAccount(null);
                          setFormVersion((value) => value + 1);
                        }, "Balance saved. Your forecast has been recalculated.");
                      }}
                    >
                      <label>
                        Account label
                        <input
                          name="label"
                          required
                          maxLength={80}
                          defaultValue={account?.label}
                        />
                      </label>
                      <Amount
                        name="balance"
                        label="Available balance"
                        value={account?.balance}
                      />
                      <button className="button full" disabled={busy}>
                        {account ? "Confirm updated balance" : "Save balance"}{" "}
                        <Arrow />
                      </button>
                      {account && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setAccount(null);
                            setFormVersion((value) => value + 1);
                          }}
                        >
                          Cancel editing
                        </button>
                      )}
                    </form>
                  </section>
                </div>
                <BankConnections />
                <button
                  className="button"
                  onClick={() =>
                    navigate(data.inputs.planConfirmed ? "overview" : "plan")
                  }
                >
                  {data.inputs.planConfirmed ? "Open Track" : "Next: Plan"}{" "}
                  <Arrow />
                </button>
              </>
            )}
            {page === "commitments" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">MAKE SPACE FOR WHAT MATTERS</p>
                    <h1>Bills & bigger plans.</h1>
                    <p>
                      Every commitment has a date. JOSEPH reserves for it in
                      your plan, without moving your money.
                    </p>
                  </div>
                </div>
                <div className="content-grid">
                  <section className="panel">
                    <h2>Your commitments</h2>
                    {data.inputs.commitments.length ? (
                      data.inputs.commitments.map((item) => (
                        <div className="item" key={item.id}>
                          <span className="item-icon">
                            {item.kind === "goal" ? "◎" : "↗"}
                          </span>
                          <div>
                            <strong>{item.label}</strong>
                            <small>
                              {date(item.dueDate)} ·{" "}
                              {item.kind === "goal"
                                ? "Goal contribution"
                                : "Bill"}
                            </small>
                            <strong>{money(item.amount)}</strong>
                          </div>
                          <div className="item-actions">
                            <button
                              className="text-button"
                              onClick={() => {
                                setCommitment(item);
                                setFormVersion((value) => value + 1);
                              }}
                            >
                              Edit<span className="sr-only"> {item.label}</span>
                            </button>
                            <button
                              className="text-button danger"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove ${item.label} from your plan?`,
                                  )
                                )
                                  run(
                                    () =>
                                      api(
                                        "/commitments/" + item.id,
                                        "DELETE",
                                        {},
                                      ),
                                    "Commitment removed.",
                                  );
                              }}
                            >
                              Remove
                              <span className="sr-only"> {item.label}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <span>◎</span>
                        <h3>What’s coming up?</h3>
                        <p>
                          Add rent, a bill or the next contribution to a goal.
                          Only your entries appear here.
                        </p>
                      </div>
                    )}
                    <Note>
                      Each entry is one scheduled payment. For recurring bills,
                      add each upcoming due date. After payment, remove the
                      entry and update your available balance so it isn’t
                      counted twice.
                    </Note>
                  </section>
                  <section className="panel">
                    <h2>
                      {commitment ? "Edit commitment" : "Add a commitment"}
                    </h2>
                    <form
                      key={formVersion}
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        run(async () => {
                          await api(
                            "/commitments" +
                              (commitment ? "/" + commitment.id : ""),
                            commitment ? "PUT" : "POST",
                            {
                              label: form.get("label"),
                              kind: form.get("kind"),
                              dueDate: form.get("dueDate"),
                              amount: kobo(form.get("amount")),
                            },
                          );
                          setCommitment(null);
                          setFormVersion((value) => value + 1);
                        }, "Commitment saved. Your forecast has been recalculated.");
                      }}
                    >
                      <label>
                        What is it for?
                        <input
                          name="label"
                          required
                          maxLength={80}
                          defaultValue={commitment?.label}
                        />
                      </label>
                      <label>
                        Type
                        <select
                          name="kind"
                          defaultValue={commitment?.kind || "bill"}
                        >
                          <option value="bill">Bill or obligation</option>
                          <option value="goal">Goal contribution</option>
                        </select>
                      </label>
                      <Amount
                        name="amount"
                        label="Amount to reserve"
                        value={commitment?.amount}
                      />
                      <label>
                        Due date
                        <input
                          name="dueDate"
                          type="date"
                          required
                          defaultValue={commitment?.dueDate}
                        />
                      </label>
                      <button className="button full" disabled={busy}>
                        Save commitment <Arrow />
                      </button>
                      {commitment && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setCommitment(null);
                            setFormVersion((value) => value + 1);
                          }}
                        >
                          Cancel editing
                        </button>
                      )}
                    </form>
                  </section>
                </div>
              </>
            )}
            {page === "plan" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">YOUR REALITY. YOUR RULES.</p>
                    <h1>A little breathing room.</h1>
                    <p>
                      Tell JOSEPH what everyday life costs, and how much you
                      want to keep back.
                    </p>
                  </div>
                </div>
                <div className="content-grid">
                  <section className="panel">
                    <h2>Your spending assumptions</h2>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        run(
                          () =>
                            api("/plan", "PUT", {
                              daily: kobo(form.get("daily")),
                              reserve: kobo(form.get("reserve")),
                              horizon: Number(form.get("horizon")),
                            }),
                          "Spending plan saved. Your forecast is ready.",
                        );
                      }}
                    >
                      <Amount
                        name="daily"
                        label="Everyday spending per day"
                        value={
                          data.inputs.planConfirmed
                            ? data.inputs.daily
                            : undefined
                        }
                      />
                      <Note>
                        Food, transport and other variable spending. Exclude
                        bills and goal contributions you enter separately.
                      </Note>
                      <Amount
                        name="reserve"
                        label="Minimum safety buffer"
                        value={
                          data.inputs.planConfirmed
                            ? data.inputs.reserve
                            : undefined
                        }
                      />
                      <label>
                        Planning horizon
                        <select
                          name="horizon"
                          defaultValue={data.inputs.horizon}
                        >
                          <option value="7">Next 7 days</option>
                          <option value="14">Next 14 days</option>
                          <option value="30">Next 30 days</option>
                          <option value="60">Next 60 days</option>
                          <option value="90">Next 90 days</option>
                        </select>
                      </label>
                      <button className="button full" disabled={busy}>
                        Confirm my spending plan <Arrow />
                      </button>
                    </form>
                  </section>
                  <section className="panel explanation">
                    <span className="large-symbol">≋</span>
                    <h2>
                      Honest inputs.
                      <br />
                      <em>Useful answers.</em>
                    </h2>
                    <p>
                      Your plan uses money available now. It doesn’t assume your
                      next salary will arrive or guess your expenses.
                    </p>
                    <p>
                      Safe to Spend is your daily allowance: available balances
                      minus bills, goals and your buffer, divided by the number
                      of days in your planning horizon.
                    </p>
                    <p>
                      This allowance includes everyday spending. Your forecast
                      and purchase checks use the daily spending you entered to
                      show whether that plan fits your available money.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => navigate("overview")}
                    >
                      See my money picture <Arrow />
                    </button>
                  </section>
                </div>
              </>
            )}
            {page === "privacy" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">YOU’RE ALWAYS IN CONTROL</p>
                    <h1>Your data. Your say.</h1>
                  </div>
                </div>
                <div className="content-grid">
                  <section className="panel">
                    <h2>Your account</h2>
                    <dl>
                      <dt>Name</dt>
                      <dd>{initialUser.name}</dd>
                      <dt>Email</dt>
                      <dd>
                        {initialUser.email} <small>· Not verified</small>
                      </dd>
                      <dt>Phone</dt>
                      <dd>
                        {initialUser.phone || "Not provided"}{" "}
                        <small>· Not verified</small>
                      </dd>
                    </dl>
                    <Note>
                      Mono sandbox connections are available in Manage. Test
                      bank data stays separate from your spending estimates.
                      Email/SMS verification and WhatsApp are not available yet.
                    </Note>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        run(
                          async () => {
                            await api("/logout", "POST", { all: true });
                            signedOut();
                          },
                          "",
                          false,
                        )
                      }
                    >
                      Sign out of all sessions <Arrow />
                    </button>
                  </section>
                  <section className="panel">
                    <h2>Take your data with you.</h2>
                    <p>
                      Download your profile, entries, consent records and the
                      latest 100 calculation snapshots.
                    </p>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() =>
                        run(
                          async () => {
                            const exported = await api("/export");
                            const url = URL.createObjectURL(
                              new Blob([JSON.stringify(exported, null, 2)], {
                                type: "application/json",
                              }),
                            );
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = "joseph-my-data.json";
                            link.click();
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          },
                          "Your export is ready.",
                          false,
                        )
                      }
                    >
                      Export my data ↓
                    </button>
                    <hr />
                    <h3>Erase my planning data</h3>
                    <p>
                      Remove all balances, recorded purchases, commitments,
                      spending assumptions and calculation history, and withdraw
                      planning consent. Your account and consent audit records
                      remain.
                    </p>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        if (
                          window.confirm(
                            "Permanently erase your planning data? This cannot be undone.",
                          )
                        )
                          run(
                            () =>
                              api("/planning-data", "DELETE", {
                                confirmation: form.get("confirmation"),
                              }),
                            "Planning data erased.",
                          );
                      }}
                    >
                      <label>
                        Type DELETE to confirm
                        <input
                          name="confirmation"
                          required
                          pattern="DELETE"
                          autoComplete="off"
                        />
                      </label>
                      <button className="button destructive" disabled={busy}>
                        Erase planning data
                      </button>
                    </form>
                    <hr />
                    <h3>Delete my account</h3>
                    <p>
                      Permanently remove your account, sessions, planning data
                      and consent records from the JOSEPH database.
                    </p>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        if (
                          window.confirm(
                            "Permanently delete your JOSEPH account and all its data?",
                          )
                        )
                          run(
                            async () => {
                              await api("/account", "DELETE", {
                                password: form.get("password"),
                                confirmation: form.get("confirmation"),
                              });
                              signedOut();
                            },
                            "",
                            false,
                          );
                      }}
                    >
                      <label>
                        Current password
                        <input
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          maxLength={72}
                        />
                      </label>
                      <label>
                        Type DELETE MY ACCOUNT to confirm
                        <input
                          name="confirmation"
                          required
                          pattern="DELETE MY ACCOUNT"
                          autoComplete="off"
                        />
                      </label>
                      <button className="button destructive" disabled={busy}>
                        Permanently delete my account
                      </button>
                    </form>
                  </section>
                </div>
              </>
            )}
          </>
        )}
        <footer className="app-footer">
          Your plan is an estimate from your entries. JOSEPH never moves or
          locks your money.
        </footer>
      </main>
    </div>
  );
}
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetLink] = useState(() => {
    const hash = window.location.hash;
    return hash.startsWith("#reset-password=")
      ? hash.slice("#reset-password=".length)
      : null;
  });
  const [mode, setMode] = useState<
    "landing" | "login" | "register" | "forgot" | "reset"
  >(resetLink !== null ? "reset" : "landing");
  useEffect(() => {
    if (resetLink !== null) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      setLoading(false);
      return;
    }
    api<{ user: User }>("/me")
      .then((result) => setUser(result.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [resetLink]);
  if (loading)
    return (
      <main className="loading">
        <Brand />
        <p>Making a little space…</p>
      </main>
    );
  if (mode === "forgot" || mode === "reset")
    return (
      <PasswordRecovery
        key={mode}
        token={mode === "reset" ? resetLink : null}
        back={() => {
          setUser(null);
          setMode("login");
        }}
        requestNew={() => setMode("forgot")}
      />
    );
  if (user)
    return (
      <Workspace
        initialUser={user}
        signedOut={() => {
          setUser(null);
          setMode("login");
        }}
      />
    );
  if (mode !== "landing")
    return (
      <Auth
        mode={mode}
        setMode={setMode}
        done={setUser}
        back={() => setMode("landing")}
        forgot={() => setMode("forgot")}
      />
    );
  return <Landing open={setMode} />;
}

// SR
