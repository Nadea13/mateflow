import { test, expect } from "@playwright/test";

test.describe("Mateflow Data Submission & API Forms E2E Suite", () => {
  test.describe.configure({ mode: "serial" });

  let page: any;
  const uniqueId = Date.now();
  const testEmail = `api_merchant_${uniqueId}@mateflow-enterprise.com`;
  const testPassword = "EnterpriseSecurePass123!";

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("01. Auth Registration & Session Setup API", async ({ request }) => {
    await page.goto("/signup");
    await page.getByLabel("Business Email").fill(testEmail);
    await page.getByRole("button", { name: "Continue with Email" }).click();

    await expect(page.getByText("Enter 6-Digit Verification Code")).toBeVisible({ timeout: 10000 });

    // Fetch OTP from Mailpit
    await page.waitForTimeout(2000);
    const mailpitRes = await request.get("http://127.0.0.1:54324/api/v1/messages");
    const mailpitData = await mailpitRes.json();
    const targetMsg = mailpitData.messages.find((m: any) =>
      m.To.some((to: any) => to.Address.toLowerCase() === testEmail.toLowerCase())
    );
    expect(targetMsg).toBeDefined();

    const otpCode = targetMsg.Subject.match(/\b\d{6}\b/)[0];
    const otpInputs = page.locator("input[type=\"text\"][inputmode=\"numeric\"]");
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

  test("02. Channel Integrations API: Save Marketplace Credentials", async () => {
    await page.goto("/dashboard/integrations");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Open configuration modal (Shopify)
    const configureBtn = page.getByRole("button", { name: "Configure" }).first();
    await configureBtn.click();

    // Verify dialog opened
    await expect(page.getByRole("heading", { name: /Connect Shopify Global Store/i })).toBeVisible();

    // Fill integration details
    const storeUrlInput = page.locator("input#store_url, input[placeholder*=\"myshopify\"]");
    if (await storeUrlInput.isVisible()) {
      await storeUrlInput.fill("https://mateflow-flagship.myshopify.com");
    }

    const tokenInput = page.locator("input#access_token, input[type=\"password\"]");
    if (await tokenInput.isVisible()) {
      await tokenInput.fill("shpat_sec_test_token_889922");
    }

    // Save connection
    await page.getByRole("button", { name: /^Save$|Save Connection|บันทึก/i }).first().click();
    await page.waitForTimeout(1000);
  });

  test("03. Operating Expense Form API: Submit Expense Transaction", async () => {
    await page.goto("/dashboard/expenses");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Open New Expense Dialog
    const addExpenseBtn = page.locator("button:has-text(\"Expense\"), button:has-text(\"Add\"), button:has-text(\"เพิ่ม\")").first();
    await addExpenseBtn.click();

    const sampleTitle = `AWS Cloud Services ${uniqueId}`;
    const titleInput = page.locator("input#title");
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.fill(sampleTitle);

    const amountInput = page.locator("input#amount");
    await amountInput.fill("249.50");

    // Save Expense
    await page.getByRole("button", { name: "Save Expense" }).click();
    await page.waitForTimeout(1500);
  });

  test("04. Multi-Warehouse Form API: Create Storage Location", async () => {
    await page.goto("/dashboard/catalog");
    
    // Switch to Warehousing Tab
    const warehouseTab = page.locator("button[role=\"tab\"]").nth(3);
    await warehouseTab.click();

    const addWarehouseBtn = page.getByRole("button", { name: /Add Location|เพิ่มคลังสินค้า/i });
    await addWarehouseBtn.click();

    const nameInput = page.locator("input#name");
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill(`Frankfurt Global Hub ${uniqueId}`);

    const codeInput = page.locator("input#code");
    if (await codeInput.isVisible()) await codeInput.fill(`FRA-${uniqueId.toString().slice(-4)}`);

    await page.getByRole("button", { name: "Save Location" }).click();
    await page.waitForTimeout(1500);
  });

  test("05. Supplier Form API: Register Supplier Partner", async () => {
    await page.goto("/dashboard/catalog");

    // Switch to Suppliers Tab
    const supplierTab = page.locator("button[role=\"tab\"]").nth(2);
    await supplierTab.click();

    const addSupplierBtn = page.getByRole("button", { name: /Add Supplier|เพิ่มคู่ค้า/i });
    await addSupplierBtn.click();

    const nameInput = page.locator("input#name");
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill(`Direct Component Logistics ${uniqueId}`);

    const emailInput = page.locator("input#email");
    if (await emailInput.isVisible()) await emailInput.fill(`contact_${uniqueId}@direct-supply.com`);

    await page.getByRole("button", { name: "Create Supplier" }).click();
    await page.waitForTimeout(1500);
  });
});
