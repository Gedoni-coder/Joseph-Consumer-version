import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/consumer/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Sign in" } }),
  );
  await page.route("**/api/consumer/refresh", (route) =>
    route.fulfill({ status: 401, json: { message: "Sign in" } }),
  );
});
test("requests recovery from sign-in, handles unavailable delivery and confirms the request", async ({
  page,
}, info) => {
  let available = false;
  await page.route("**/api/consumer/forgot-password", (route) =>
    route.fulfill(
      available
        ? {
            status: 202,
            json: {
              message:
                "If an active account matches that email, you will receive a reset link.",
            },
          }
        : {
            status: 503,
            json: {
              message:
                "Password recovery is temporarily unavailable. Please try again later.",
            },
          },
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email address").fill("recovery@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "temporarily unavailable",
  );
  available = true;
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your email." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("recovery-request.png"),
    fullPage: true,
  });
});
test("clears the URL token, validates confirmation, reports expired links and completes a reset", async ({
  page,
}, info) => {
  let expired = true,
    requests = 0;
  await page.route("**/api/consumer/reset-password", (route) => {
    requests++;
    expect(route.request().postDataJSON().token).toBe("a".repeat(64));
    return route.fulfill(
      expired
        ? {
            status: 400,
            json: {
              message:
                "This reset link has expired or has already been used. Request a new link.",
            },
          }
        : {
            status: 200,
            json: {
              message:
                "Your password has been changed. Sign in with your new password.",
            },
          },
    );
  });
  await page.goto("/#reset-password=" + "a".repeat(64));
  await expect(
    page.getByRole("heading", { name: "Choose a new password." }),
  ).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  expect(
    await page.evaluate(
      () =>
        Object.keys(localStorage).length + Object.keys(sessionStorage).length,
    ),
  ).toBe(0);
  await page.getByLabel("New password", { exact: true }).fill("NewPassword42!");
  await page.getByLabel("Confirm new password").fill("WrongPassword42!");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "The passwords do not match.",
  );
  expect(requests).toBe(0);
  await page.getByLabel("Confirm new password").fill("NewPassword42!");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("alert")).toContainText("expired");
  await page.screenshot({
    path: info.outputPath("reset-password.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expired = false;
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(
    page.getByRole("heading", { name: "Password changed." }),
  ).toBeVisible();
});
test("an incomplete reset link offers a new request", async ({ page }) => {
  await page.goto("/#reset-password=invalid");
  await expect(page.getByRole("alert")).toContainText("incomplete or invalid");
  await page.getByRole("button", { name: "Request a new link" }).click();
  await expect(page.getByLabel("Email address")).toBeVisible();
});

// SR
