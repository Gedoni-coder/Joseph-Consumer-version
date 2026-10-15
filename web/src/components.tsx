import { useState, type FormEvent, type ReactNode } from "react";
import { api, money, type State, type User } from "./api";
export function Brand() {
  return (
    <a className="brand" href="/" aria-label="JOSEPH home">
      <span className="brand-mark">j.</span>joseph
      <span className="brand-dot">®</span>
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
            <p className="eyebrow">
              <span className="live-dot" /> A LITTLE CLARITY GOES A LONG WAY
            </p>
            <h1>
              Your money.
              <br />
              Your plans.
              <br />
              <em>Room to breathe.</em>
            </h1>
            <p className="hero-description">
              Know what’s spoken for. See what’s left. Make your next money
              decision with a plan that adds up.
            </p>
            <button className="button" onClick={() => open("register")}>
              Build my money picture <Arrow />
            </button>
            <p className="hero-footnote">
              Start with your own numbers. No bank login needed.
            </p>
          </div>
          <div
            className="hero-art"
            aria-label="Your money, organised around your life"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="orbit-core">j.</div>
            <div className="orbit-label label-one">
              <span>01</span> The essentials
            </div>
            <div className="orbit-label label-two">
              <span>02</span> The bigger plans
            </div>
            <div className="orbit-label label-three">
              <span>03</span> A little breathing room
            </div>
            <span className="art-caption">MAKE SPACE FOR WHAT MATTERS.</span>
          </div>
        </section>
        <section className="manifesto" id="how">
          <p className="eyebrow">LESS GUESSWORK. MORE LIVING.</p>
          <h2>
            A plan for the life
            <br />
            you’re <em>actually living.</em>
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
              Clarity.
              <br />
              <em>Without the custody.</em>
            </h2>
          </div>
          <div>
            <p>
              JOSEPH helps you plan. It doesn’t move your money or lock your
              funds.
            </p>
            <p>
              This local version saves your entries and calculates from them.
              Bank connections, verification messages and WhatsApp are not
              available yet.
            </p>
            <button className="button light" onClick={() => open("register")}>
              Start your plan <Arrow />
            </button>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <Brand />
        <p>Made for a little more peace of mind.</p>
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
              ? "Create your account to save a personal money plan."
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
                available in this local version.
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
  const values = state.projection.map((day) => day.cash);
  const max = Math.max(state.liquid, state.reserve, 1);
  const min = Math.min(0, ...values);
  const y = (value: number) => 150 - ((value - min) / (max - min || 1)) * 125;
  const points = values
    .map((value, i) => `${30 + (i / (values.length - 1)) * 570},${y(value)}`)
    .join(" ");
  return (
    <div className="projection">
      <svg
        viewBox="0 0 630 180"
        role="img"
        aria-label={`Projected cash over ${state.horizon} days. Final projected balance ${money(values.at(-1) ?? 0)}.`}
      >
        <defs>
          <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4442bd" stopOpacity=".18" />
            <stop offset="100%" stopColor="#4442bd" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1="30"
          x2="600"
          y1={y(state.reserve)}
          y2={y(state.reserve)}
          stroke="#94938d"
          strokeDasharray="4 6"
        />
        <polygon
          points={`30,155 ${points} 600,155`}
          fill="url(#forecast-fill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#33319b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <text x="30" y="174">
          Today
        </text>
        <text x="600" y="174" textAnchor="end">
          Day {state.horizon}
        </text>
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
        and use them to calculate a personal forecast. These are estimates from
        your entries, not verified bank information.
      </p>
      <ul>
        <li>No bank credentials are requested. No money is moved.</li>
        <li>Amounts reserved in the plan stay in your own accounts.</li>
        <li>
          You can export your information or erase your planning data in
          Privacy.
        </li>
        <li>
          You can also permanently delete your account in Privacy.
        </li>
      </ul>
      <Note>
        This consent covers local manual planning only. Bank-data processing and
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
          my entries for this local money plan.
        </label>
        <button className="button" disabled={busy}>
          Agree and continue <Arrow />
        </button>
      </form>
    </section>
  );
}
