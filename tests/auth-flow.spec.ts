import { test, expect } from "@playwright/test";

test.describe("Mateflow Authentication & OTP Flow", () => {
  test("1. Login Page UI check", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Mateflow" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign In to Your Account" })).toBeVisible();
    await expect(page.getByLabel("Business Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In to Dashboard" })).toBeVisible();
  });

  test("2. Signup Page email-only input & OTP step transition", async ({ page }) => {
    const testEmail1 = `pw_reg_${Date.now()}@test.com`;
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Register Your Business" })).toBeVisible();
    
    // Only email input should be visible (No Full Name)
    await expect(page.getByLabel("Business Email")).toBeVisible();
    await expect(page.getByLabel("Full Name")).not.toBeVisible();

    // Fill email and submit to send OTP
    await page.getByLabel("Business Email").fill(testEmail1);
    await page.getByRole("button", { name: "Continue with Email" }).click();

    // Verify 6 OTP input boxes appear
    await expect(page.getByText("Enter 6-Digit Verification Code")).toBeVisible({ timeout: 10000 });
    const otpInputs = page.locator("input[type=\"text\"][inputmode=\"numeric\"]");
    await expect(otpInputs).toHaveCount(6);
  });

  test("3. Fetch OTP from Mailpit and complete Password Creation", async ({ page, request }) => {
    const testEmail2 = `pw_otp_${Date.now()}@test.com`;
    await page.goto("/signup");
    await page.getByLabel("Business Email").fill(testEmail2);
    await page.getByRole("button", { name: "Continue with Email" }).click();

    await expect(page.getByText("Enter 6-Digit Verification Code")).toBeVisible({ timeout: 10000 });

    // Wait a brief moment for Mailpit to receive the email
    await page.waitForTimeout(2000);

    // Fetch latest message from Mailpit API
    const mailpitRes = await request.get("http://127.0.0.1:54324/api/v1/messages");
    expect(mailpitRes.ok()).toBeTruthy();
    const mailpitData = await mailpitRes.json();

    // Find email sent to testEmail2
    const targetMsg = mailpitData.messages.find((m: any) =>
      m.To.some((to: any) => to.Address.toLowerCase() === testEmail2.toLowerCase())
    );

    expect(targetMsg).toBeDefined();

    // Extract exact 6-digit OTP from Subject line "Your Mateflow Verification Code: 123456"
    const subjectMatch = targetMsg.Subject.match(/\b\d{6}\b/);
    expect(subjectMatch).not.toBeNull();
    const otpCode = subjectMatch![0];
    console.log(`[Playwright Test] Found exact OTP: "${otpCode}" in Subject for ${testEmail2}`);

    // Fill each box with exact OTP digit
    const otpInputs = page.locator("input[type=\"text\"][inputmode=\"numeric\"]");
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otpCode[i]);
    }

    // Submit OTP verification
    await page.getByRole("button", { name: "Verify & Continue" }).click();

    // Expect Step 3: Create Password
    await expect(page.getByLabel("Create Password")).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("Confirm Password")).toBeVisible({ timeout: 10000 });

    // Fill password and complete signup
    await page.getByLabel("Create Password").fill("AdminSecure123!");
    await page.getByLabel("Confirm Password").fill("AdminSecure123!");
    await page.getByRole("button", { name: "Complete & Enter Backoffice" }).click();

    // Verify redirected to Dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
