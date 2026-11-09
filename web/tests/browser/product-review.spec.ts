import { expect, test } from "@playwright/test";
import { calculate, nigeriaDate } from "../../../backend/src/consumer/engine";

test("keeps workspace controls available and distinguishes new dates from history", async ({
  page,
}, info) => {
  const now = new Date();
  const today = nigeriaDate(now);
  const yesterday = nigeriaDate(new Date(now.getTime() - 86400000));
  const user = {
    id: "review",
    name: "Review User",
    email: "review@example.com",
  };
  const inputs = {
    asOf: now.toISOString(),
    horizon: 30,
    daily: 100000,
    reserve: 500000,
    planConfirmed: true,
    accounts: [
      {
        id: "cash",
        label: "Cash",
        balance: 10000000,
        confirmedAt: now.toISOString(),
      },
    ],
    commitments: [
      {
        id: "bill",
        label: "Overdue bill",
        amount: 100000,
        kind: "bill" as const,
        dueDate: yesterday,
      },
    ],
  };
  const dashboard = {
    user,
    inputs,
    state: calculate(inputs),
    consent: true,
    requiresOnboarding: false,
    history: [],
    spending: {
      from: today,
      to: today,
      days: 0,
      count: 0,
      total: 0,
      daily: null,
    },
  };
  let dashboardCalls = 0;
  let fail = false;
  await page.route("**/api/consumer/me", (route) =>
    route.fulfill({ json: { user } }),
  );
  await page.route("**/api/consumer/dashboard", (route) => {
    dashboardCalls++;
    return route.fulfill(
      fail
        ? { status: 503, json: { message: "Unable to refresh. Please retry." } }
        : { json: dashboard },
    );
  });
  await page.route("**/api/consumer/purchases", (route) =>
    route.fulfill({ json: { purchases: [], nextOffset: null } }),
  );
  await page.route("**/api/consumer/progress", (route) =>
    route.fulfill({
      json: {
        weekStart: today,
        weekEnd: today,
        total: 0,
        count: 0,
        categories: [],
        xp: { totalMilli: 0, weekMilli: 0, streak: 0, checkedInToday: false },
        previous: {
          weekStart: yesterday,
          weekEnd: yesterday,
          total: 0,
          count: 0,
          categories: [],
          reviewed: false,
          canReview: false,
        },
      },
    }),
  );
  await page.goto("/");
  const summary = page.getByRole("region", { name: "Plan balances" });
  await expect(summary).toBeVisible();
  const summaryBox = await summary.boundingBox();
  const safeBox = await page.getByTestId("safe-to-spend").boundingBox();
  expect(summaryBox!.y + summaryBox!.height).toBeLessThan(safeBox!.y);
  await page.screenshot({
    path: info.outputPath("dashboard.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "+ Record purchase" }).click();
  const purchase = page.getByLabel("Purchase date");
  await purchase.fill(yesterday);
  expect(
    await purchase.evaluate((el: HTMLInputElement) => el.validity.valid),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const header = page.locator(".app-header");
  expect((await header.boundingBox())!.y).toBe(0);
  const refresh = header.getByRole("button", { name: "Refresh" });
  await expect(refresh).toBeInViewport();
  await refresh.click();
  await expect(page.getByRole("status")).toHaveText(
    "Your picture is up to date.",
  );
  expect(dashboardCalls).toBeGreaterThan(1);
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 8000 });
  fail = true;
  await refresh.click();
  await expect(page.getByRole("alert")).toHaveText(
    "Unable to refresh. Please retry.",
  );
  await page.clock.install();
  await page.clock.fastForward(7000);
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("button", { name: "Bills & goals", exact: true })
    .click();
  const due = page.getByLabel("Due date", { exact: true });
  await due.fill(yesterday);
  expect(
    await due.evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow),
  ).toBe(true);
  await due.fill(today);
  expect(await due.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(
    true,
  );
  await page
    .getByRole("button", { name: "Edit Overdue bill", exact: true })
    .click();
  await expect(due).toHaveValue(yesterday);
  expect(await due.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(
    true,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

// SR
