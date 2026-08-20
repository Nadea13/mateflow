import { test, expect } from "@playwright/test";

test.describe("Mateflow Comprehensive Full-System E2E & Page Audits", () => {
  test.describe.configure({ mode: "serial" });

  let page: any;
  const testEmail = `merchant_${Date.now()}@mateflow-enterprise.com`;
  const testPassword = "EnterpriseSecurePass123!";

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("01. Complete User Registration via 6-Digit OTP & Password Creation", async ({ request }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Register Your Business" })).toBeVisible();

    // Fill email
    await page.getByLabel("Business Email").fill(testEmail);
    await page.getByRole("button", { name: "Continue with Email" }).click();

    // Verify 6 OTP boxes
    await expect(page.getByText("Enter 6-Digit Verification Code")).toBeVisible({ timeout: 10000 });
    const otpInputs = page.locator("input[type=\"text\"][inputmode=\"numeric\"]");
    await expect(otpInputs).toHaveCount(6);

    // Fetch OTP from Mailpit
    await page.waitForTimeout(2000);
    const mailpitRes = await request.get("http://127.0.0.1:54324/api/v1/messages");
    const mailpitData = await mailpitRes.json();
    const targetMsg = mailpitData.messages.find((m: any) =>
      m.To.some((to: any) => to.Address.toLowerCase() === testEmail.toLowerCase())
    );
    expect(targetMsg).toBeDefined();

    const otpCode = targetMsg.Subject.match(/\b\d{6}\b/)[0];
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otpCode[i]);
    }
    await page.getByRole("button", { name: "Verify & Continue" }).click();

    // Set Password
    await expect(page.getByLabel("Create Password")).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Create Password").fill(testPassword);
    await page.getByLabel("Confirm Password").fill(testPassword);
    await page.getByRole("button", { name: "Complete & Enter Backoffice" }).click();

    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("02. Executive Dashboard Overview & TopBar Verification", async () => {
    await page.goto("/dashboard");
    
    // TopBar status
    await expect(page.getByText("Production Workspace")).toBeVisible();
    
    // Header & Quick Action Links
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("a[href=\"/dashboard/bills\"]").first()).toBeVisible();
    await expect(page.locator("a[href=\"/dashboard/integrations\"]").first()).toBeVisible();

    // Navigation Sidebar
    await expect(page.locator("aside nav a[href=\"/dashboard\"]")).toBeVisible();
    await expect(page.locator("aside nav a[href=\"/dashboard/catalog\"]")).toBeVisible();
    await expect(page.locator("aside nav a[href=\"/dashboard/bills\"]")).toBeVisible();
    await expect(page.locator("aside nav a[href=\"/dashboard/integrations\"]")).toBeVisible();
    await expect(page.locator("aside nav a[href=\"/dashboard/expenses\"]")).toBeVisible();
    await expect(page.locator("aside nav a[href=\"/dashboard/history\"]")).toBeVisible();
    await expect(page.locator("aside nav a[href=\"/dashboard/settings\"]")).toBeVisible();
  });

  test("03. Registry & Inventory Catalog (Products, Customers, Suppliers, Warehousing)", async () => {
    await page.goto("/dashboard/catalog");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Test tab switches
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(4);

    await tabs.nth(1).click(); // Customers
    await page.waitForTimeout(300);

    await tabs.nth(2).click(); // Suppliers
    await page.waitForTimeout(300);

    await tabs.nth(3).click(); // Warehousing
    await page.waitForTimeout(300);

    await tabs.nth(0).click(); // Products
    await page.waitForTimeout(300);
  });

  test("04. Commercial Invoices & Global Tax Engine", async () => {
    await page.goto("/dashboard/bills");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("button:has-text(\"Invoice\"), button:has-text(\"Bill\"), button:has-text(\"สร้าง\"), button:has-text(\"Create\")").first()).toBeVisible();
  });

  test("05. Omni-Channel & Marketplace Integration Hub", async () => {
    await page.goto("/dashboard/integrations");
    await expect(page.getByRole("heading", { level: 1, name: "Omni-Channel Integrations" })).toBeVisible();

    // Global Sync Action
    await expect(page.getByRole("button", { name: "Sync All Channels" })).toBeVisible();

    // Verify All 4 Marketplace Channels
    await expect(page.getByText("Shopify Global")).toBeVisible();
    await expect(page.getByText("Amazon Seller Central")).toBeVisible();
    await expect(page.getByText("TikTok Shop Global")).toBeVisible();
    await expect(page.getByText("WooCommerce")).toBeVisible();

    // Check Configure modal button
    const configureButtons = page.getByRole("button", { name: "Configure" });
    await expect(configureButtons.first()).toBeVisible();
  });

  test("06. Expense & Operating Costs Tracker", async () => {
    await page.goto("/dashboard/expenses");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("button:has-text(\"Expense\"), button:has-text(\"Add\"), button:has-text(\"เพิ่ม\")").first()).toBeVisible();
  });

  test("07. Transaction History & Audit Logs", async () => {
    await page.goto("/dashboard/history");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("08. Store Profile & Global System Settings", async () => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(testEmail).first()).toBeVisible();
  });

  test("09. Email + Password Sign-In Verification", async ({ browser }) => {
    const loginPage = await browser.newPage();
    await loginPage.goto("/login");
    await expect(loginPage.getByRole("heading", { name: "Sign In to Your Account" })).toBeVisible();

    await loginPage.getByLabel("Business Email").fill(testEmail);
    await loginPage.getByLabel("Password").fill(testPassword);
    await loginPage.getByRole("button", { name: "Sign In to Dashboard" }).click();

    await loginPage.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(loginPage).toHaveURL(/.*dashboard/);
    await loginPage.close();
  });
});
