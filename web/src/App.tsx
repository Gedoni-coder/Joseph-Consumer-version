import { useEffect, useRef, useState } from 'react';
import { formatMoney, questions, scenarios } from './demo';

type IconName = 'arrow' | 'arrow-up' | 'check' | 'shield' | 'menu' | 'close' | 'grid' | 'wallet' | 'goal' | 'chat' | 'plus' | 'chevron' | 'sun' | 'lock';
function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
    'arrow-up': <><path d="M6 18 18 6M6 6h12v12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z" /><path d="m8 12 3 3 5-6" /></>,
    menu: <><path d="M4 8h16M4 16h16" /></>,
    close: <><path d="m6 6 12 12M6 18 18 6" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    wallet: <><path d="M4 7V5h14v3M4 8h16v12H4z" /><path d="M20 12h-5v4h5" /></>,
    goal: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m12 12 9-9M16 3h5v5" /></>,
    chat: <path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2m-3-7 2-2M5 19l2-2M5 5l2 2m10 10 2 2" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  };
  return <svg className={`icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Brand({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? 'brand-small' : ''}`}><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M13 7h19v17c0 9-5 13-13 13S6 32 6 25h8c0 4 2 5 5 5s5-2 5-6V15H13z" fill="currentColor" /><circle cx="8" cy="10" r="3" fill="currentColor" /></svg><span>JOSEPH<span className="brand-period">.</span></span></span>;
}

function Header({ onEarlyAccess }: { onEarlyAccess: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  return <header className="site-header"><div className="header-inner wrap">
    <a className="brand-link" href="#top" aria-label="JOSEPH home" onClick={() => setMenuOpen(false)}><Brand /></a>
    <nav id="main-navigation" className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
      <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
      <a href="#experience" onClick={() => setMenuOpen(false)}>The experience</a>
      <a href="#our-approach" onClick={() => setMenuOpen(false)}>Our approach</a>
      <button className="mobile-access" onClick={() => { setMenuOpen(false); onEarlyAccess(); }}>Get early access <Icon name="arrow" /></button>
    </nav>
    <button className="button header-cta" onClick={onEarlyAccess}>Get early access <Icon name="arrow-up" /></button>
    <button ref={menuButton} className="menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
  </div></header>;
}

function Hero() {
  return <section className="hero wrap" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="eyebrow"><span className="status-dot" /> YOUR MONEY. A CLEARER PICTURE.</p>
      <h1 id="hero-title">Money clarity.<br />Life, on<br />{' '}<em>your terms.</em><span className="heading-spark" aria-hidden="true">✳</span></h1>
      <p className="hero-description">Bills. Big plans. That little enjoyment.<br />Meet the money companion that helps you make room for all of it.</p>
      <div className="hero-actions"><a className="button button-primary" href="#experience">Meet JOSEPH <Icon name="arrow-up" /></a><a className="text-link" href="#how-it-works">See how it works <span className="play-icon" aria-hidden="true">↗</span></a></div>
      <p className="hero-note"><span className="tiny-stars" aria-hidden="true">✦</span> Built for life in Nigeria. Made for your next chapter.</p>
    </div>
    <div className="hero-art">
      <div className="art-coordinate" aria-hidden="true">A LITTLE CLARITY<br /><span>A LOT MORE POSSIBILITY.</span></div>
      <img className="hero-sculpture" src="/joseph-orbit.webp" alt="" width="1024" height="1024" fetchPriority="high" />
      <div className="orbit-label" aria-hidden="true"><span /> Find your breathing room</div>
      <div className="hero-money-card">
        <div className="mini-card-top"><span className="mini-brand">j.</span><span>Your money, in perspective</span><Icon name="sun" /></div>
        <div className="money-card-main"><span>Safe to spend</span><strong>₦72,000<span>.00</span></strong><p><span className="green-dot" /> Bills & goals already considered</p></div>
        <div className="mini-card-bottom"><span>Illustrative product preview</span><a href="#experience" aria-label="Explore the sample money dashboard"><Icon name="arrow-up" /></a></div>
      </div>
      <div className="goal-float"><span className="goal-float-icon"><Icon name="goal" /></span><div><strong>That next big thing?</strong><span>You're making room for it.</span></div></div>
      <span className="art-index" aria-hidden="true">01 — FINANCIAL BREATHING ROOM</span>
    </div>
  </section>;
}

function HowItWorks() {
  const steps = [
    { number: '01', title: 'Bring it all together.', text: 'The plan: connect your accounts, review your spending, and see your money in one place.', icon: 'wallet' as const },
    { number: '02', title: 'Make room for real life.', text: 'Your bills, everyday needs and future goals belong in the picture before you spend.', icon: 'goal' as const },
    { number: '03', title: 'Move with more clarity.', text: 'Understand the trade-offs. Ask a question. Make your next money decision with context.', icon: 'sun' as const },
  ];
  return <section id="how-it-works" className="how-section wrap section-space">
    <div className="section-top"><p className="eyebrow">A DIFFERENT KIND OF MONEY COMPANION</p><span className="section-index">01 / THE IDEA</span></div>
    <div className="intro-grid"><h2>Your balance tells<br />only <em>half the story.</em></h2><p>What about rent next week? The laptop you're saving for? Or a weekend that doesn't end in regret?<br /><br />JOSEPH is being built to connect the dots between what you have and what life needs.</p></div>
    <div className="steps">{steps.map(step => <article className="step" key={step.number}><div className="step-top"><span>{step.number}</span><Icon name={step.icon} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
  </section>;
}

function Demo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [view, setView] = useState<'overview' | 'commitments' | 'goals'>('overview');
  const scenario = scenarios[scenarioIndex];
  return <section id="experience" className="experience-section section-space">
    <div className="wrap">
      <div className="section-top"><p className="eyebrow"><span className="status-dot" /> LESS GUESSWORK. MORE LIVING.</p><span className="section-index">02 / THE EXPERIENCE</span></div>
      <div className="experience-heading"><h2>Big picture.<br /><em>Small sigh of relief.</em></h2><p>A glimpse of what we're building.<br />Try a few everyday decisions and see<br className="desktop-break" /> how the picture changes.</p></div>
      <div className="dashboard">
        <aside className="dashboard-sidebar"><Brand small /><span className="workspace-label">YOUR SPACE</span><nav aria-label="Demo dashboard views">{([{ id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'commitments', label: 'Commitments', icon: 'wallet' }, { id: 'goals', label: 'My goals', icon: 'goal' }] as const).map(item => <button key={item.id} aria-pressed={view === item.id} onClick={() => setView(item.id)}><Icon name={item.icon} />{item.label}{view === item.id && <span className="nav-current-dot" />}</button>)}</nav><div className="sidebar-bottom"><span className="avatar">T</span><div><strong>Tomi's space</strong><span>Demo account</span></div><Icon name="chevron" /></div></aside>
        <div className="dashboard-content">
          <div className="dashboard-top"><div><p>LET'S TAKE A LOOK</p><h3>{view === 'overview' ? 'Your money, at a glance.' : view === 'commitments' ? 'The things that come first.' : 'A little closer, every day.'}</h3></div><span className="sample-badge"><span /> SAMPLE DATA</span></div>
          {view === 'overview' && <div className="overview-layout">
            <div className={`balance-card ${scenarioIndex === 2 ? 'balance-tight' : ''}`}><div className="balance-label"><span>Safe to spend</span><Icon name="arrow-up" /></div><strong className="balance-value" aria-live="polite">{formatMoney(scenario.available)}<span>.00</span></strong><p>After bills, goals{scenario.purchase > 0 ? ' and this purchase' : ' and essentials'}.</p><div className="balance-chart" aria-hidden="true"><svg viewBox="0 0 420 74" preserveAspectRatio="none"><path d="M0 65C25 65 20 46 45 48S67 62 87 39s28 8 47-2 25 16 51-4 24 9 47-2 26 9 50-3 36 4 57-11 45 9 81-13" /></svg><div className="chart-dates"><span>YOUR MONEY</span><span>YOUR POSSIBILITIES</span></div></div></div>
            <div className="allocation-card"><span className="card-overline">THE FULL PICTURE</span><div className="allocation-total"><span>Account balance</span><strong>{formatMoney(285000 - scenario.purchase)}</strong></div><div className="allocation-line"><span><i className="legend-dot navy-dot" />Bills & essentials</span><strong>₦165,000</strong></div><div className="allocation-line"><span><i className="legend-dot mint-dot" />Towards your goals</span><strong>₦48,000</strong></div><div className="allocation-line available-line"><span><i className="legend-dot lime-dot" />Room to spend</span><strong>{formatMoney(scenario.available)}</strong></div><div className="allocation-bar" aria-hidden="true"><span style={{ flex: 165000 }} /><span style={{ flex: 48000 }} /><span style={{ flex: scenario.available }} /></div></div>
          </div>}
          {view === 'commitments' && <div className="commitments-panel"><div className="panel-heading"><span>UPCOMING IN THIS SAMPLE PLAN</span><strong>₦165,000 <small>set aside</small></strong></div>{[{ title: 'Rent contribution', detail: 'Your next rent payment', amount: '₦100,000', icon: 'wallet' as const }, { title: 'Everyday essentials', detail: 'Food, transport and the little things', amount: '₦45,000', icon: 'sun' as const }, { title: 'Bills & subscriptions', detail: 'Power, internet and subscriptions', amount: '₦20,000', icon: 'check' as const }].map(item => <div className="commitment-row" key={item.title}><span className="row-icon"><Icon name={item.icon} /></span><div><strong>{item.title}</strong><span>{item.detail}</span></div><b>{item.amount}</b></div>)}</div>}
          {view === 'goals' && <div className="goal-panel"><div className="laptop-illustration" aria-hidden="true"><div className="laptop-screen"><span>THE NEXT<br /><em>big thing.</em></span><span className="laptop-spark">✳</span></div><div className="laptop-base" /></div><div className="goal-detail"><span className="card-overline">A LITTLE MORE POSSIBILITY</span><h4>Your next laptop.</h4><p>For the work. For the ideas. For what's next.</p><div className="goal-progress-label"><strong>₦240,000 <span>of ₦400,000</span></strong><span>60%</span></div><div className="goal-progress" role="progressbar" aria-label="Sample laptop goal progress" aria-valuenow={60} aria-valuemin={0} aria-valuemax={100}><span /></div><p className="goal-footnote">₦48,000 allocated in this sample plan.</p></div></div>}
          <div className="insight-strip" aria-live="polite"><span className="insight-icon">✦</span><div><strong>{scenario.title}</strong><p>{scenario.description}</p></div></div>
        </div>
      </div>
      <div className="demo-controls"><div><span className="demo-pointer" aria-hidden="true">↳</span><div><strong>Life happens. Try a little “what if”.</strong><span>Choose a sample purchase.</span></div></div><div className="scenario-buttons" role="group" aria-label="Sample purchase scenario">{scenarios.map((item, index) => <button key={item.id} aria-pressed={scenarioIndex === index} onClick={() => { setScenarioIndex(index); setView('overview'); }}>{item.label}<span>{item.purchase ? formatMoney(item.purchase) : 'No extra spend'}</span></button>)}</div></div>
      <p className="demo-disclaimer">Interactive concept · Illustrative figures, not a connected account or financial recommendation.</p>
    </div>
  </section>;
}

function Conversation() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [replaying, setReplaying] = useState(false);
  useEffect(() => { if (!replaying) return; const timer = window.setTimeout(() => setReplaying(false), 450); return () => window.clearTimeout(timer); }, [replaying]);
  return <section className="conversation-section wrap section-space" aria-labelledby="conversation-title"><div className="conversation-copy"><p className="eyebrow">IT STARTS WITH A SIMPLE QUESTION</p><h2 id="conversation-title">Talk money.<br /><em>Like you talk life.</em></h2><p>No spreadsheet language. No judgement.<br />Just a clearer answer to the question<br className="desktop-break" /> on your mind.</p><div className="question-picker" role="group" aria-label="Explore sample conversations">{questions.map((item, index) => <button key={item.label} aria-pressed={questionIndex === index} onClick={() => { setQuestionIndex(index); setReplaying(true); }}>{item.label}<Icon name="arrow-up" /></button>)}</div><span className="channel-note"><Icon name="chat" /> Designed for the web. WhatsApp is in the plan.</span></div><div className="chat-stage"><span className="chat-spark" aria-hidden="true">✳</span><div className="chat-window"><div className="chat-header"><span className="chat-avatar">j.</span><div><strong>JOSEPH</strong><span>Your money companion</span></div><span className="chat-demo-label">DEMO</span></div><div className="chat-body"><span className="chat-date">A LITTLE CLARITY FOR TODAY</span><div className="chat-question" key={`q-${questionIndex}`}>{questions[questionIndex].question}<span>12:04 <span aria-hidden="true">✓✓</span></span></div><div className="chat-answer" aria-live="polite" aria-busy={replaying}>{replaying ? <span className="typing-dots" aria-label="Loading sample reply">•••</span> : <><span className="reply-name">JOSEPH</span><p>{questions[questionIndex].answer}</p><span className="answer-context"><Icon name="check" /> Based on the sample plan</span></>}</div></div><div className="chat-bottom"><Icon name="lock" /><span>Scripted preview. No messages are sent.</span></div></div><span className="chat-caption">THE NUMBERS, WITH A HUMAN TOUCH.</span></div></section>;
}

function Approach() {
  return <section id="our-approach" className="approach-section"><div className="wrap approach-inner"><div className="approach-icon"><Icon name="shield" /><span aria-hidden="true">✦</span></div><div><p className="eyebrow">YOUR MONEY IS PERSONAL. WE GET IT.</p><h2>Clarity starts<br />with <em>trust.</em></h2></div><div className="approach-principles"><article><span>01</span><div><h3>You stay in control.</h3><p>The planned bank connection is read-only. JOSEPH is being built to understand your money, not move it.</p></div></article><article><span>02</span><div><h3>Real numbers. Clear reasons.</h3><p>Our approach: calculate from financial facts, then explain the result in language that makes sense.</p></div></article><article><span>03</span><div><h3>Your permission comes first.</h3><p>Consent and control are part of the design. This preview never asks for bank details or accesses your accounts.</p></div></article></div></div></section>;
}

const faqs = [
  { q: 'So, what exactly is JOSEPH?', a: 'JOSEPH is a financial clarity product being built for people in Nigeria. The idea is to bring your balances, upcoming commitments and goals into one picture, then help you understand what room you have to spend.' },
  { q: 'Can I connect my bank account yet?', a: 'Not in this preview. Everything you see here is illustrative sample data. Secure, read-only bank connection is part of the planned product and will need testing before it is available.' },
  { q: 'Does JOSEPH hold or move my money?', a: 'No. This preview has no access to your money. The planned MVP is read-only financial intelligence, not a wallet or payment service.' },
  { q: 'Will it work on WhatsApp?', a: 'That is the plan: a web experience for the full picture and WhatsApp for everyday questions. The conversation above is a scripted preview; live messaging is not available here yet.' },
  { q: 'When can I start using it?', a: 'We are building and testing the first version. There is no confirmed launch date or pricing yet. You can explore this demo now without creating an account or sharing personal details.' },
];

function FAQ() {
  return <section id="questions" className="faq-section wrap section-space"><div><p className="eyebrow">A LITTLE MORE CLARITY</p><h2>Good<br /><em>questions.</em></h2><p>Here's where we're at.</p></div><div className="faq-list">{faqs.map((item, index) => <details key={item.q}><summary><span className="faq-number">0{index + 1}</span><span>{item.q}</span><Icon name="plus" /></summary><p>{item.a}</p></details>)}</div></section>;
}

function EarlyAccess({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const wrapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = element.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    element.addEventListener('keydown', wrapFocus);
    return () => {
      element.removeEventListener('keydown', wrapFocus);
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);
  return <dialog ref={dialog} className="access-dialog" aria-labelledby="access-title" aria-describedby="access-description" onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="dialog-content"><button className="dialog-close" onClick={onClose} aria-label="Close early access information"><Icon name="close" /></button><Brand /><span className="dialog-art" aria-hidden="true">✳</span><p className="eyebrow">GOOD THINGS TAKE A LITTLE BUILDING.</p><h2 id="access-title">Your next chapter<br />is <em>on its way.</em></h2><p id="access-description">JOSEPH is still in development. Early-access registration isn't open yet, but you can get a feel for what's coming.</p><a className="button button-primary" href="#experience" onClick={onClose}>Explore the interactive demo <Icon name="arrow" /></a><span className="dialog-note">No signup. No bank details. Just a little clarity.</span></div></dialog>;
}

export default function App() {
  const [accessOpen, setAccessOpen] = useState(false);
  return <><a className="skip-link" href="#main">Skip to content</a><div id="top" /><Header onEarlyAccess={() => setAccessOpen(true)} /><main id="main"><Hero /><div className="promise-strip"><div className="wrap"><span>BIG AMBITIONS.<br /><strong>EVERYDAY MONEY.</strong></span><span><Icon name="wallet" /> Naira-first thinking</span><span><Icon name="goal" /> Your goals in the picture</span><span><Icon name="chat" /> A little less money stress</span><span className="strip-star" aria-hidden="true">✳</span></div></div><HowItWorks /><Demo /><Conversation /><Approach /><FAQ /><section className="closing-section"><div className="wrap"><p className="eyebrow">FOR THE LIFE YOU'RE BUILDING</p><h2>Make room<br />for <em>what matters.</em><span aria-hidden="true">✳</span></h2><a className="button button-light" href="#experience">Take JOSEPH for a spin <Icon name="arrow-up" /></a><span className="closing-note">Explore the demo. Imagine the possibilities.</span></div></section></main><footer className="site-footer wrap"><div className="footer-top"><a className="brand-link" href="#top" aria-label="JOSEPH home"><Brand /></a><span>A clearer picture. A little more life.</span><a href="#top" className="back-to-top">Back to top <Icon name="arrow-up" /></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} JOSEPH AI</span><span>Made with Nigeria in mind.</span><nav aria-label="Footer navigation"><a href="#our-approach">Our approach</a><a href="#questions">FAQs</a><button onClick={() => setAccessOpen(true)}>Early access</button></nav></div></footer><EarlyAccess open={accessOpen} onClose={() => setAccessOpen(false)} /></>;
}
