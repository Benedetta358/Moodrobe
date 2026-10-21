import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("sample review does not overwrite the personal wardrobe", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("heading", { name: "Wear your state of mind." })
    .waitFor();
  await page.waitForTimeout(300);
  const personal = await page.evaluate(() =>
    localStorage.getItem("moodrobe-v1"),
  );
  await page.goto("/?demo=1");
  await page
    .getByRole("button", { name: /Set your mood and occasion/ })
    .click();
  await page.getByRole("button", { name: "Feeling energised" }).click();
  await page.getByRole("button", { name: "Save my check-in" }).click();
  expect(await page.evaluate(() => localStorage.getItem("moodrobe-v1"))).toBe(
    personal,
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("moodrobe-review-session-v1")).checkin
          .mood,
    ),
  ).toBe("bright");
  await page.reload();
  await expect(page.getByText("1 / 5 explored")).toBeVisible();
});
test("consent, withdrawal and optional export record real events only", async ({
  page,
}) => {
  await page.goto("/?demo=1&study=1");
  await expect(
    page.getByRole("button", { name: "Start my session" }),
  ).toBeDisabled();
  await page.getByLabel("Anonymous participant code").fill("TEST01");
  await page.getByLabel("I confirm that I am 18 or older.").check();
  await page.getByLabel(/I consent to this local/).check();
  await page.getByRole("button", { name: "Start my session" }).click();
  await expect(page.getByText("Code:", { exact: false }).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: /Set your mood and occasion/ })
    .click();
  await page.getByRole("button", { name: "Save my check-in" }).click();
  await page.getByRole("button", { name: "Finish or withdraw" }).click();
  await page.getByLabel("How easy was the experience?").selectOption("4");
  await page
    .getByLabel("Would you wear one of the suggested outfits?")
    .selectOption("maybe");
  await page.getByRole("button", { name: "Save my observations" }).click();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("moodrobe-usability-v1")),
  );
  expect(s.active).toBeNull();
  expect(Object.keys(s.completed[0].tasks)).toEqual(["checkin"]);
  expect(s.completed[0].answers.ease).toBe(4);
  expect(s.completed[0].items).toBeUndefined();
  await expect(
    page.getByRole("button", { name: "Download my session" }),
  ).toBeVisible();
});
test("review and research pages are accessible and have no invented results", async ({
  page,
}) => {
  for (const path of ["/review.html", "/research.html", "/?demo=1"]) {
    await page.goto(path);
    await page.waitForTimeout(300);
    const a = await new AxeBuilder({ page }).analyze();
    expect(a.violations).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/research.html");
  await expect(
    page.getByText("No external sessions imported", { exact: false }).first(),
  ).toBeVisible();
});
test("research import deduplicates real files, separates conditions and escapes comments", async ({
  page,
}) => {
  const { beginSession, recordTask, finishSession } =
    await import("../../src/study.js");
  const now = Date.now(),
    s = finishSession(
      recordTask(beginSession("AUTOTEST", "sample", now), "checkin", now + 100),
      { ease: 4, wouldWear: "yes", obstacle: "<img src=x onerror=alert(1)>" },
      now + 1000,
    );
  await page.goto("/research.html");
  await page
    .locator("#files")
    .setInputFiles({
      name: "automated-test-only.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          schema: "moodrobe-usability-batch-v1",
          sessions: [s, s],
        }),
      ),
    });
  await expect(page.locator("#status")).toContainText("1 new session");
  await expect(page.locator("#metrics")).toContainText("1completed sessions");
  await expect(page.locator("#tasks tr").first()).toContainText("1 / 1");
  await page.locator("#observations summary").click();
  await expect(page.locator("#observations p")).toHaveText(
    "<img src=x onerror=alert(1)>",
  );
  expect(await page.locator("#observations img").count()).toBe(0);
  await page.reload();
  await expect(page.locator("#empty")).toBeVisible();
});
