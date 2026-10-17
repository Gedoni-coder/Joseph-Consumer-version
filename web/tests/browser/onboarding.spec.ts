import { expect, test } from "@playwright/test";
test("template answers populate the dashboard and its modules once", async ({
  page,
}, info) => {
  const id = Date.now().toString() + Math.floor(Math.random() * 1000);
  await page.goto("/");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByLabel("Full name").fill("Onboarding QA");
  await page.getByLabel("Phone number").fill("080" + id.slice(-8));
  await page.getByLabel("Email address").fill(`onboarding-${id}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("OnboardingTest42!");
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(
    page.getByRole("heading", { name: "Let's set up your plan." }),
  ).toBeVisible();
  try {
    await page.getByLabel("Everyday spending per day").fill("1000");
    await page.getByLabel("Minimum safety buffer").fill("10000");
    await page.getByLabel("Cash or money you will not connect").fill("100000");
    await page.getByRole("button", { name: "Add a bill" }).click();
    await page.getByLabel("What is it for?").fill("Rent");
    await page.getByLabel("Amount to set aside").fill("20000");
    const due = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    await page.getByLabel("Next payment date").fill(due);
    await page.getByRole("button", { name: "Add a goal" }).click();
    await page.getByLabel("What is it for?").nth(1).fill("Laptop");
    await page.getByLabel("Amount to set aside").nth(1).fill("5000");
    await page.getByLabel("Next payment date").nth(1).fill(due);
    await page.getByRole("checkbox").check();
    await page.screenshot({
      path: info.outputPath("onboarding.png"),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Save plan and continue" }).click();
    await expect(
      page.getByRole("heading", { name: "Bring your bank into the picture." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue without a bank" }).click();
    await expect(page.getByTestId("safe-to-spend")).toHaveText("₦2,166.66/day");
    await expect(page.getByTestId("burn-rate")).toHaveText("—/day");
    await expect(page.getByTestId("projected-runway")).toHaveText("—days");
    await expect(
      page.getByRole("button", { name: "Bills & goals" }),
    ).not.toBeVisible();
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Workspace menu" });
    await expect(
      drawer.getByRole("navigation").getByRole("button"),
    ).toHaveCount(4);
    const privacy = await drawer
      .getByRole("button", { name: "Privacy & account" })
      .boundingBox();
    const plan = await drawer
      .getByRole("button", { name: "Spending plan", exact: true })
      .boundingBox();
    expect(privacy!.y).toBeGreaterThan(plan!.y + plan!.height);
    await page.screenshot({ path: info.outputPath("side-menu.png") });
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open menu", exact: true }),
    ).toBeFocused();
    await expect(
      page.locator(".projection").getByText("Amount (₦)", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".projection").getByText("Date", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "+ Record purchase", exact: true })
      .click();
    await page.getByLabel("Purchase", { exact: true }).fill("Groceries");
    await page.getByLabel("Amount spent").fill("7000");
    await page
      .getByRole("button", { name: "Save purchase", exact: true })
      .click();
    await expect(page.getByTestId("burn-rate")).toHaveText("₦7,000/day");
    await expect(page.getByTestId("projected-runway")).toHaveText("14.3days");
    await expect(
      page.getByRole("row").filter({ hasText: "Groceries" }),
    ).toContainText("₦7,000");
    await expect(page.getByTestId("safe-to-spend")).toHaveText("₦2,166.66/day");
    await page.reload();
    await expect(page.getByTestId("safe-to-spend")).toHaveText("₦2,166.66/day");
    await expect(page.getByTestId("burn-rate")).toHaveText("₦7,000/day");
    await expect(page.getByTestId("projected-runway")).toHaveText("14.3days");
    await expect(
      page.getByRole("row").filter({ hasText: "Groceries" }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath("spending-dashboard.png"),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Delete purchase Groceries", exact: true })
      .click();
    await expect(page.getByTestId("burn-rate")).toHaveText("—/day");
    await expect(page.getByTestId("projected-runway")).toHaveText("—days");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page.getByRole("button", { name: "Bills & goals" }).click();
    await expect(
      page.getByRole("button", { name: "Edit Rent", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit Laptop", exact: true }),
    ).toBeVisible();
    const response = await page.request.get("/api/consumer/dashboard");
    const data = await response.json();
    expect(data.inputs.accounts).toHaveLength(1);
    expect(data.inputs.commitments).toHaveLength(2);
  } finally {
    const origin = new URL(page.url()).origin;
    const cleanup = await page.request.delete("/api/consumer/account", {
      headers: { Origin: origin },
      data: {
        password: "OnboardingTest42!",
        confirmation: "DELETE MY ACCOUNT",
      },
    });
    expect(cleanup.status()).toBe(200);
  }
});
