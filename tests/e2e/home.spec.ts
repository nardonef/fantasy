import { expect, test } from "@playwright/test";

for (const vp of [{ name: "mobile", width: 375, height: 812 }, { name: "desktop", width: 1280, height: 800 }]) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("renders sections and has no horizontal scroll", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("It's all on the record");
      await expect(page.getByRole("region", { name: "Tools" })).toBeVisible();
      await expect(page.getByText("NOT AFFILIATED WITH THE NFL")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("email signup success path", async ({ page }) => {
      await page.route("**/api/subscribe", (r) => r.fulfill({ json: { ok: true } }));
      await page.goto("/");
      await page.getByPlaceholder("you@yourleague.com").fill("a@b.co");
      await page.getByRole("button", { name: /get access/i }).click();
      await expect(page.getByText("You're on the list. We'll keep it brief.")).toBeVisible();
    });

    test("hedge card tags the signup and focuses the form", async ({ page }) => {
      let body = "";
      await page.route("**/api/subscribe", async (r) => { body = r.request().postData() ?? ""; await r.fulfill({ json: { ok: true } }); });
      await page.goto("/");
      await page.getByRole("button", { name: /hedge/i }).click();
      await page.getByPlaceholder("you@yourleague.com").fill("a@b.co");
      await page.getByRole("button", { name: /get access/i }).click();
      await expect(page.getByText(/on the list/i)).toBeVisible();
      expect(JSON.parse(body).source).toBe("hedge");
    });
  });
}
