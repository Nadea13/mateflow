import { test, expect } from "@playwright/test";

test.describe("Mateflow Stripe Billing & Monetization E2E", () => {
  test.describe.configure({ mode: "serial" });

  let page: any;
  const uniqueId = Date.now();
  const testEmail = `stripe_merchant_${uniqueId}@mateflow.io`;
  const testPassword = "EnterprisePass123!";

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("01. Auth Registration & Navigate to Billing Plans (Multi-Language)", async ({ request }) => {
    await page.goto("/signup");
    await page.getByLabel("Business Email").fill(testEmail);
    await page.getByRole("button", { name: "Continue with Email" }).click();

    await expect(page.getByText("Enter 6-Digit Verification Code")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    const mailpitRes = await request.get("http://127.0.0.1:54324/api/v1/messages");
    const mailpitData = await mailpitRes.json();
    const targetMsg = mailpitData.messages.find((m: any) =>
      m.To.some((to: any) => to.Address.toLowerCase() === testEmail.toLowerCase())
    );
    const otpCode = targetMsg.Subject.match(/\b\d{6}\b/)[0];
    const otpInputs = page.locator("input[type=\"text\"][inputmode=\"numeric\"]");
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otpCode[i]);
    }
    await page.getByRole("button", { name: "Verify & Continue" }).click();

    await expect(page.getByLabel("Create Password")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Create Password").fill(testPassword);
    await page.getByLabel("Confirm Password").fill(testPassword);
    await page.getByRole("button", { name: "Complete & Enter Backoffice" }).click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // Navigate to Billing
    await page.goto("/dashboard/billing");
    await page.waitForLoadState("networkidle");

    // Verify Plan Cards Exist (TH/EN)
    await expect(page.getByText("Business Pro").first()).toBeVisible();
    await expect(page.getByText("Enterprise Scale").first()).toBeVisible();
  });

  test("02. Currency Switcher, Monthly/Yearly Tabs & Upgrade Tier Action", async () => {
    await page.goto("/dashboard/billing");
    await page.waitForLoadState("networkidle");

    // Toggle Currency
    await page.getByRole("button", { name: "USD ($)" }).click();
    await expect(page.getByText("$18")).toBeVisible();

    // Toggle Yearly Billing Tab
    const yearlyTab = page.getByRole("button", { name: /Yearly|รายปี/i });
    await expect(yearlyTab).toBeVisible();
    await yearlyTab.click();
    await expect(page.getByText("$180")).toBeVisible();

    // Switch back to THB Yearly
    await page.getByRole("button", { name: "THB (฿)" }).click();
    await expect(page.getByText("฿5,900")).toBeVisible();

    // Switch to Monthly
    const monthlyTab = page.getByRole("button", { name: /Monthly|รายเดือน/i });
    await monthlyTab.click();
    await expect(page.getByText("฿590")).toBeVisible();

    // Trigger Business Pro Upgrade
    const upgradeButton = page.getByRole("button", { name: /Upgrade to Business Pro|อัปเกรดเป็น Business Pro/i });
    await expect(upgradeButton).toBeVisible();
    await upgradeButton.click();
    await page.waitForTimeout(3000);

    // Verify active tier updated
    await page.goto("/dashboard/billing");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /Upgrade to Enterprise Scale|อัปเกรดเป็น Enterprise Scale/i })).toBeVisible();
  });
});
