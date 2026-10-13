import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { act, createElement } from 'react';

let dom;
let server;
let App;
let createRoot;
let root;

before(async () => {
  dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost:5173', pretendToBeVisual: true,
  });
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLDialogElement', 'Event', 'MouseEvent', 'KeyboardEvent']) {
    Object.defineProperty(globalThis, name, { configurable: true, value: name === 'window' ? dom.window : dom.window[name] });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom has no top-layer or native dialog implementation. This tests application
  // state only; real-browser focus trapping and rendering remain a separate check.
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event('close'));
  };
  ({ createRoot } = await import('react-dom/client'));
  server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' });
  ({ default: App } = await server.ssrLoadModule('/src/App.tsx'));
});

beforeEach(async () => {
  root = createRoot(document.getElementById('root'));
  await act(async () => root.render(createElement(App)));
});

afterEach(async () => { await act(async () => root.unmount()); });
after(async () => { await server?.close(); dom?.window.close(); });

const click = async selector => {
  const button = document.querySelector(selector);
  assert.ok(button, `Missing control: ${selector}`);
  await act(async () => button.click());
};

test('every local navigation destination exists and the preview collects no personal data', () => {
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    assert.ok(document.getElementById(link.getAttribute('href').slice(1)), `Broken destination ${link.href}`);
  }
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(document.querySelectorAll('form, input').length, 0);
  assert.match(document.querySelector('.demo-disclaimer').textContent, /Illustrative figures/);
  assert.match(document.querySelector('.chat-bottom').textContent, /No messages are sent/);
});

test('purchase scenarios update balances, allocations and explanations together', async () => {
  const cases = [
    { nth: 2, available: '₦54,000', balance: '₦267,000', explanation: '₦18,000 dinner' },
    { nth: 3, available: '₦7,000', balance: '₦220,000', explanation: '₦65,000 headphones' },
    { nth: 1, available: '₦72,000', balance: '₦285,000', explanation: 'already set aside' },
  ];
  for (const item of cases) {
    await click(`.scenario-buttons button:nth-child(${item.nth})`);
    assert.equal(document.querySelector('.balance-value').textContent, `${item.available}.00`);
    assert.equal(document.querySelector('.allocation-total strong').textContent, item.balance);
    assert.equal(document.querySelector('.available-line strong').textContent, item.available);
    assert.ok(document.querySelector('.insight-strip').textContent.includes(item.explanation));
    assert.equal(document.querySelectorAll('.scenario-buttons [aria-pressed="true"]').length, 1);
  }
});

test('dashboard navigation shows commitments and goal progress, then a scenario returns to overview', async () => {
  await click('.dashboard-sidebar nav button:nth-child(2)');
  assert.equal(document.querySelectorAll('.commitment-row').length, 3);
  assert.equal(document.querySelector('.balance-value'), null);
  await click('.dashboard-sidebar nav button:nth-child(3)');
  assert.equal(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'), '60');
  assert.match(document.querySelector('.goal-detail').textContent, /₦240,000/);
  await click('.scenario-buttons button:nth-child(2)');
  assert.equal(document.querySelector('.dashboard-sidebar nav button').getAttribute('aria-pressed'), 'true');
  assert.equal(document.querySelector('.balance-value').textContent, '₦54,000.00');
});

test('sample conversation buttons replace the question and the scripted answer', async () => {
  await click('.question-picker button:nth-child(3)');
  assert.match(document.querySelector('.chat-question').textContent, /laptop goal/);
  assert.equal(document.querySelector('.chat-answer').getAttribute('aria-busy'), 'true');
  await act(async () => new Promise(resolve => setTimeout(resolve, 500)));
  assert.match(document.querySelector('.chat-answer').textContent, /₦240,000 of a ₦400,000/);
  assert.equal(document.querySelector('.chat-answer').getAttribute('aria-busy'), 'false');
  assert.equal(document.querySelectorAll('.question-picker [aria-pressed="true"]').length, 1);
});

test('mobile navigation opens, closes on Escape, and closes after choosing a destination', async () => {
  await click('.menu-toggle');
  assert.equal(document.querySelector('.menu-toggle').getAttribute('aria-expanded'), 'true');
  await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })));
  assert.equal(document.querySelector('.menu-toggle').getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, document.querySelector('.menu-toggle'));
  await click('.menu-toggle');
  await click('.main-nav a');
  assert.equal(document.querySelector('.menu-toggle').getAttribute('aria-expanded'), 'false');
});

test('early access explains availability and closes without pretending to create an account', async () => {
  await click('.header-cta');
  assert.equal(document.querySelector('dialog').open, true);
  assert.equal(document.body.style.overflow, 'hidden');
  assert.match(document.querySelector('#access-description').textContent, /registration isn't open yet/);
  await click('.dialog-content > a');
  assert.equal(document.querySelector('dialog').open, false);
  assert.equal(document.body.style.overflow, '');
  await click('.header-cta');
  await click('.dialog-close');
  assert.equal(document.querySelector('dialog').open, false);
});
