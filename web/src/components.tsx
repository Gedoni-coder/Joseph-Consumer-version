import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { api, money, type State, type User } from "./api";
export function Brand() {
  return (
    <a className="brand" href="/" aria-label="JOSEPH AI home">
      <img
        className="brand-logo"
        src="/joseph-ai-logo-transparent.png"
        alt="JOSEPH AI — dove carrying an olive branch"
        width="720"
        height="240"
        fetchPriority="high"
      />
    </a>
  );
}
export function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
export function Amount({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: number;
}) {
  return (
    <label>
      {label}
      <span className="amount-input">
        <span aria-hidden="true">₦</span>
        <input
          name={name}
          type="number"
          inputMode="decimal"
          min="0"
          max="10000000000"
          step="0.01"
          required
          defaultValue={value === undefined ? "" : value / 100}
        />
      </span>
    </label>
  );
}
export function Note({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>;
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
}
export const date = (value: string) =>
  new Date(value + "T12:00:00Z").toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export function Landing({
  open,
}: {
  open: (mode: "login" | "register") => void;
}) {
  return (
    <div className="landing">
      <header className="site-header">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#how">How it works</a>
          <button className="text-button" onClick={() => open("login")}>
            Sign in
          </button>
          <button className="button small" onClick={() => open("register")}>
            Get started <Arrow />
          </button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">PERSONAL FINANCE, WITH A PLAN</p>
            <h1>
              Your money.
              <br />
              In perspective.
              <br />
            </h1>
            <p className="hero-description">
              Bills coming up. Plans worth keeping. Know how much room you have
              before you make your next move.
            </p>
            <button className="button" onClick={() => open("register")}>
              Build my money picture <Arrow />
            </button>
            <p className="hero-footnote">
              Start with your own numbers. No bank login needed.
            </p>
          </div>
          <div
            className="money-ledger"
            aria-label="How JOSEPH organises your money plan"
          >
            <div className="ledger-heading">
              <span>THE MONEY PICTURE</span>
              <span>01—03</span>
            </div>
            <div className="ledger-row essentials">
              <span className="ledger-index">01</span>
              <div>
                <h2>Life comes first.</h2>
                <p>Bills. Everyday spending. Your buffer.</p>
              </div>
              <span className="ledger-sign" aria-hidden="true">
                −
              </span>
            </div>
            <div className="ledger-row plans">
              <span className="ledger-index">02</span>
              <div>
                <h2>Keep the plan.</h2>
                <p>Put dates and amounts on your goals.</p>
              </div>
              <span className="ledger-sign" aria-hidden="true">
                −
              </span>
            </div>
            <div className="ledger-row room">
              <span className="ledger-index">03</span>
              <div>
                <h2>Know your room.</h2>
                <p>Check a purchase against what’s ahead.</p>
              </div>
              <span className="ledger-sign" aria-hidden="true">
                =
              </span>
            </div>
            <div className="ledger-caption">
              <span>YOUR ENTRIES → YOUR FORECAST</span>
              <span>NGN / ₦</span>
            </div>
          </div>
        </section>
        <section className="manifesto" id="how">
          <p className="eyebrow">A PRACTICAL ROUTINE</p>
          <h2>
            Put the numbers
            <br />
            in their place.
          </h2>
          <div className="steps">
            <article>
              <span>01 / BRING THE NUMBERS</span>
              <h3>Start where you are.</h3>
              <p>
                Add your available balances and everyday spending. Everything
                starts with what you tell JOSEPH.
              </p>
            </article>
            <article>
              <span>02 / GIVE YOUR PLANS SPACE</span>
              <h3>Make room for life.</h3>
              <p>
                Put dates on bills and goal contributions. Set a buffer for the
                unexpected.
              </p>
            </article>
            <article>
              <span>03 / CHECK BEFORE YOU SPEND</span>
              <h3>Decide with context.</h3>
              <p>
                See how a purchase changes your spending room and projected
                runway before you commit.
              </p>
            </article>
          </div>
        </section>
        <section className="promise">
          <div>
            <p className="eyebrow">YOUR MONEY STAYS YOURS</p>
            <h2>
              A money plan.
              <br />
              You stay in control.
            </h2>
          </div>
          <div>
            <p>
              JOSEPH helps you plan. It doesn’t move your money or lock your
              funds.
            </p>
            <p>
              This planning beta saves your entries and calculates from them.
              Mono sandbox connections are available for testing. Verification
              messages and WhatsApp are not available yet.
            </p>
            <button className="button light" onClick={() => open("register")}>
              Start your plan <Arrow />
            </button>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <Brand />
        <p>Personal money planning. Built for Nigeria.</p>
        <span>NGN · Nigeria</span>
      </footer>
    </div>
  );
}
export function Auth({
  mode,
  setMode,
  done,
  back,
}: {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  done: (user: User) => void;
  back: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ user: User }>(
        "/" + mode,
        "POST",
        Object.fromEntries(form),
      );
      done(result.user);
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
          <p className="eyebrow">A FRESH PERSPECTIVE</p>
          <h1>
            Good plans
            <br />
            start with
            <br />
            <em>your reality.</em>
          </h1>
          <p>
            No sample balances. No guessed answers.
            <br />
            Just your money, with a clearer picture.
          </p>
        </div>
        <span>YOUR NEXT CHAPTER STARTS HERE.</span>
      </aside>
      <section>
        <button className="text-button back" onClick={back}>
          ← Back to JOSEPH
        </button>
        <div className="auth-form">
          <p className="eyebrow">
            {mode === "register" ? "LET’S GET TO KNOW YOU" : "WELCOME BACK"}
          </p>
          <h2>
            {mode === "register"
              ? "Make yourself at home."
              : "Your plans are waiting."}
          </h2>
          <p>
            {mode === "register"
              ? "Step 1 of 2: your details. Next, a short form sets up your money plan and bank connection."
              : "Sign in to pick up where you left off."}
          </p>
          <form onSubmit={submit} key={mode}>
            {mode === "register" && (
              <>
                <label>
                  Full name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label>
                  Phone number
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    pattern="\+?[0-9]{10,15}"
                    title="10–15 digits, optionally starting with +"
                  />
                </label>
              </>
            )}
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "register" ? 8 : undefined}
                maxLength={72}
              />
            </label>
            {mode === "register" && (
              <Note>
                Use at least 8 characters, with an uppercase letter, a lowercase
                letter and a number. Email and phone verification are not
                available in this planning beta.
              </Note>
            )}
            <ErrorMessage message={error} />
            <button className="button full" disabled={busy}>
              {busy
                ? "One moment…"
                : mode === "register"
                  ? "Create my account"
                  : "Sign in"}{" "}
              <Arrow />
            </button>
          </form>
          <p className="switch-auth">
            {mode === "register"
              ? "Already have an account?"
              : "New to JOSEPH?"}{" "}
            <button
              className="text-button"
              onClick={() => {
                setError("");
                setMode(mode === "register" ? "login" : "register");
              }}
            >
              {mode === "register" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
export function Projection({ state }: { state: State }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(210, entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const values = state.projection.map((day) => day.cash);
  const max = Math.max(state.liquid, state.reserve, 100);
  const min = Math.min(0, ...values);
  const y = (value: number) => 210 - ((value - min) / (max - min || 1)) * 165;
  const left = 68,
    right = width - 18;
  const x = (index: number) =>
    left + (index / Math.max(values.length - 1, 1)) * (right - left);
  const compact = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value / 100);
  const tickCount = width < 420 ? 3 : 5;
  const points = values.map((value, i) => `${x(i)},${y(value)}`).join(" ");
  return (
    <div className="projection" ref={container}>
      <svg
        viewBox={`0 0 ${width} 270`}
        role="img"
        aria-label={`Projected cash over ${state.horizon} days. Final projected balance ${money(values.at(-1) ?? 0)}.`}
      >
        <defs>
          <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#344c9e" stopOpacity=".18" />
            <stop offset="100%" stopColor="#344c9e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <text x="0" y="18" className="axis-title">
          Amount (₦)
        </text>
        {Array.from({ length: 5 }, (_, i) => {
          const value = min + ((max - min) * i) / 4;
          return (
            <g key={i}>
              <line
                x1={left}
                x2={right}
                y1={y(value)}
                y2={y(value)}
                stroke="#e5e8f0"
              />
              <text x={left - 10} y={y(value) + 4} textAnchor="end">
                {compact(value)}
              </text>
            </g>
          );
        })}
        <line
          x1={left}
          x2={right}
          y1={y(state.reserve)}
          y2={y(state.reserve)}
          stroke="#94938d"
          strokeDasharray="4 6"
        />
        <polygon
          points={`${left},210 ${points} ${right},210`}
          fill="url(#forecast-fill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#03031d"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {Array.from({ length: tickCount }, (_, i) => {
          const index = Math.round((i / (tickCount - 1)) * (values.length - 1));
          const day = state.projection[index];
          return (
            <g key={i}>
              <line
                x1={x(index)}
                x2={x(index)}
                y1="210"
                y2="216"
                stroke="#9299ad"
              />
              <text
                x={x(index)}
                y="236"
                textAnchor={
                  i === 0 ? "start" : i === tickCount - 1 ? "end" : "middle"
                }
              >
                {new Date(day.date + "T12:00:00Z").toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                })}
              </text>
            </g>
          );
        })}
        <text
          x={(left + right) / 2}
          y="263"
          textAnchor="middle"
          className="axis-title"
        >
          Date
        </text>
        {state.projection.map((day, i) => (
          <circle
            key={day.date}
            cx={x(i)}
            cy={y(day.cash)}
            r="3"
            fill="#03031d"
          >
            <title>
              {date(day.date)}: {money(day.cash)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="chart-legend">
        <span>
          <i /> Projected cash
        </span>
        <span>Dashed line: your {money(state.reserve)} buffer</span>
      </div>
    </div>
  );
}
export function Consent({ save, busy }: { save: () => void; busy: boolean }) {
  return (
    <section className="panel consent">
      <p className="eyebrow">FIRST, YOU’RE IN CONTROL</p>
      <h2>
        Your information.
        <br />
        <em>Your choice.</em>
      </h2>
      <p>
        JOSEPH will store the balances, commitments and spending plan you enter,
        and use them to calculate a personal forecast. In the hosted app, your
        information is stored on JOSEPH?s servers. These are estimates from your
        entries, not verified bank information.
      </p>
      <ul>
        <li>No bank credentials are requested. No money is moved.</li>
        <li>Amounts reserved in the plan stay in your own accounts.</li>
        <li>
          You can export your information or erase your planning data in
          Privacy.
        </li>
        <li>You can also permanently delete your account in Privacy.</li>
      </ul>
      <Note>
        This consent covers manual planning only. Bank-data processing and
        WhatsApp require separate setup and consent before use.
      </Note>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label className="checkbox">
          <input type="checkbox" required /> I agree to the storage and use of
          my entries for my money plan.
        </label>
        <button className="button" disabled={busy}>
          Agree and continue <Arrow />
        </button>
      </form>
    </section>
  );
}
