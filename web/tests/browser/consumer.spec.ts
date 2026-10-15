import { expect, test } from "@playwright/test";
test("real account, persistent plan, purchase checks, edits, export and withdrawal", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const unique = Date.now().toString() + Math.floor(Math.random() * 1000);
  const email = `browser-${unique}@example.com`;
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your money/ })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("landing.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByLabel("Full name").fill("Browser Test");
  await page.getByLabel("Phone number").fill("080" + unique.slice(-8));
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("RealFlowPassword42!");
  await page.getByRole("button", { name: "Create my account" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await expect(page.getByTestId("safe-to-spend")).toHaveText("—");
  const cookies = await context.cookies();
  expect(
    cookies
      .filter((cookie) => cookie.name.startsWith("joseph_"))
      .every((cookie) => cookie.httpOnly && cookie.sameSite === "Strict"),
  ).toBe(true);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page
    .getByRole("button", { name: "Add a balance", exact: false })
    .click();
  await page.getByLabel("Account label").fill("My current account");
  await page
    .getByRole("spinbutton", { name: "Available balance", exact: true })
    .fill("100000");
  await page.getByRole("button", { name: "Save balance" }).click();
  await expect(page.getByRole("status")).toContainText("Balance saved");
  await page.getByRole("button", { name: "Next: spending plan" }).click();
  await page.getByLabel("Everyday spending per day").fill("1000");
  await page.getByLabel("Minimum safety buffer").fill("10000");
  await page.getByRole("button", { name: "Confirm my spending plan" }).click();
  await expect(page.getByRole("status")).toContainText("Spending plan saved");
  await page.getByRole("button", { name: "Bills & goals" }).click();
  await page.getByLabel("What is it for?").fill("Rent");
  await page.getByLabel("Amount to reserve").fill("20000");
  const dueDate = new Date(Date.now() + 5 * 86400000)
    .toISOString()
    .slice(0, 10);
  await page.getByLabel("Due date").fill(dueDate);
  await page.getByRole("button", { name: "Save commitment" }).click();
  await expect(page.getByRole("status")).toContainText("Commitment saved");
  await page.getByLabel("What is it for?").fill("Laptop contribution");
  await page
    .getByRole("combobox", { name: "Type", exact: true })
    .selectOption("goal");
  await page.getByLabel("Amount to reserve").fill("5000");
  await page.getByLabel("Due date").fill(dueDate);
  await page.getByRole("button", { name: "Save commitment" }).click();
  await expect(page.getByRole("status")).toContainText("Commitment saved");
  await page.getByRole("button", { name: "My overview" }).click();
  await expect(page.getByTestId("safe-to-spend")).toHaveText("₦35,000");
  await page.getByLabel("Purchase amount").fill("10000");
  await page.getByRole("button", { name: "Check this purchase" }).click();
  await expect(page.getByRole("status")).toContainText(
    "This fits your current plan.",
  );
  await expect(page.getByRole("status")).toContainText("₦25,000");
  await page.getByLabel("Purchase amount").fill("40000");
  await page.getByRole("button", { name: "Check this purchase" }).click();
  await expect(page.getByRole("status")).toContainText(
    "This would stretch your plan.",
  );
  await expect(page.getByTestId("safe-to-spend")).toHaveText("₦35,000");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByTestId("safe-to-spend")).toHaveText("₦35,000");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("WrongPassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Email or password is incorrect",
  );
  await page
    .getByLabel("Password", { exact: true })
    .fill("RealFlowPassword42!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByTestId("safe-to-spend")).toHaveText("₦35,000");
  await page.getByRole("button", { name: "Balances", exact: true }).click();
  await page.getByRole("button", { name: "Update My current account" }).click();
  await page
    .getByRole("spinbutton", { name: "Available balance", exact: true })
    .fill("120000");
  await page.getByRole("button", { name: "Confirm updated balance" }).click();
  await expect(page.getByRole("status")).toContainText("Balance saved");
  await page.getByRole("button", { name: "Bills & goals" }).click();
  await page.getByRole("button", { name: "Edit Rent", exact: true }).click();
  await page.getByLabel("Amount to reserve").fill("25000");
  await page.getByRole("button", { name: "Save commitment" }).click();
  await expect(page.getByRole("status")).toContainText("Commitment saved");
  await page.getByRole("button", { name: "My overview" }).click();
  await expect(page.getByTestId("safe-to-spend")).toHaveText("₦50,000");
  await page.getByRole("button", { name: "Privacy & account" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export my data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("joseph-my-data.json");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.user.email).toBe(email);
  expect(exported.inputs.accounts[0].balance).toBe(12_000_000);
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Erase planning data" }).click();
  await expect(page.getByRole("status")).toContainText("Planning data erased.");
  await page.getByRole("button", { name: "My overview" }).click();
  await expect(
    page.getByRole("button", { name: "Agree and continue" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Privacy & account" }).click();
  await page.getByLabel("Current password").fill("RealFlowPassword42!");
  await page
    .getByLabel("Type DELETE MY ACCOUNT to confirm")
    .fill("DELETE MY ACCOUNT");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Permanently delete my account" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your plans are waiting." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("keyboard navigation and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  await page.getByRole("button", { name: "Get started" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Make yourself at home." }),
  ).toBeVisible();
  await page.getByLabel("Full name").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Phone number")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
