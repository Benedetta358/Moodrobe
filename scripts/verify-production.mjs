import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined);
const b = await chromium.launch({ executablePath });
try {
  const page = await b.newPage({ viewport: { width: 1440, height: 1100 } }),
    failures = [],
    remote = [];
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("requestfailed", (r) =>
    failures.push(r.url() + ": " + r.failure()?.errorText),
  );
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5180") &&
      !r.url().startsWith("blob:") &&
      !r.url().startsWith("data:")
    )
      remote.push(r.url());
  });
  await page.goto("http://127.0.0.1:5180");
  async function infer(brief) {
    await page.getByLabel("What does today look like?").fill(brief);
    await page.getByRole("button", { name: "Create with local AI" }).click();
    await page
      .getByRole("button", { name: "Refresh neural edit" })
      .waitFor({ timeout: 90000 });
    assert.equal(await page.locator(".engine-tag.neural").count(), 3);
    await page
      .getByRole("button", { name: "Open The everyday anchor" })
      .click();
    const names = await page
      .locator(".piece-list>div>span:nth-child(2)")
      .allTextContents();
    await page.keyboard.press("Escape");
    return names;
  }
  const formal = await infer(
    "A formal evening event, a polished elegant structured black dress, tailored blazer and sophisticated leather shoes.",
  );
  const casual = await infer(
    "A relaxed casual day walking on campus, blue denim jeans, comfortable white sneakers and a light cotton t-shirt.",
  );
  assert.notDeepEqual(
    formal,
    casual,
    "The two contrasting briefs should change the leading edit.",
  );
  await page.screenshot({
    path: "docs/moodrobe-v2-neural.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: "docs/moodrobe-v2-neural-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(failures, []);
  assert.deepEqual(remote, []);
  console.log(
    JSON.stringify({
      productionInference: "passed",
      formal,
      casual,
      externalRequests: remote.length,
      pageErrors: failures.length,
    }),
  );
} finally {
  await b.close();
}
