import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("heading", { name: "Wear your state of mind." })
    .waitFor();
});
const nav = (p, name) =>
  p.getByRole("navigation").getByRole("button", { name, exact: true });
test("English daily journey persists check-in, saved edit, plan and diary", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.getByRole("button", { name: "Build my daily edit" }).click();
  await page.getByRole("button", { name: "Feeling energised" }).click();
  await page.getByLabel("What’s the occasion?").selectOption("Work / campus");
  await page.getByLabel("Outside temperature").fill("12");
  await page.getByRole("button", { name: "Save my check-in" }).click();
  await page.getByRole("button", { name: "Open The everyday anchor" }).click();
  await page.getByRole("button", { name: "Save edit", exact: true }).click();
  await page.getByRole("button", { name: "Plan it", exact: true }).click();
  await page.getByRole("button", { name: "Plan this outfit" }).click();
  await nav(page, "Saved & diary").click();
  await expect(
    page.getByRole("heading", { name: "The everyday anchor" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Planned", exact: false }).click();
  await page
    .getByRole("button", { name: "Wear it today", exact: true })
    .click();
  await page.getByRole("button", { name: "Wear diary" }).click();
  await expect(
    page.getByRole("heading", { name: "The everyday anchor" }),
  ).toBeVisible();
  await page.reload();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("moodrobe-v1")),
  );
  expect(s.checkin.mood).toBe("bright");
  expect(s.saved.length).toBe(1);
  expect(s.history.length).toBe(1);
  expect(s.plans.length).toBe(0);
  expect(errors).toEqual([]);
  expect(await page.locator("html").getAttribute("lang")).toBe("en");
});
test("wardrobe photo upload, search, availability and removal", async ({
  page,
}) => {
  await nav(page, "Your wardrobe").click();
  await page.getByRole("button", { name: "Add a piece", exact: true }).click();
  const png = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 200;
      c.height = 300;
      const x = c.getContext("2d");
      x.fillStyle = "#7395b1";
      x.fillRect(0, 0, 200, 300);
      return c.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "Blue-shirt.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByAltText("Piece preview")).toBeVisible();
  await page.getByLabel("Piece name").fill("My blue shirt");
  await page
    .getByLabel("Describe the feel")
    .fill("Soft linen, relaxed, creative and easy to layer");
  await page.getByRole("button", { name: "Add to my wardrobe" }).click();
  await page.getByRole("textbox", { name: "Search wardrobe" }).fill("My blue");
  await page.getByRole("button", { name: /My blue shirt/ }).click();
  await page.getByRole("checkbox", { name: /Available for outfits/ }).uncheck();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
  await page.reload();
  await nav(page, "Your wardrobe").click();
  await expect(page.getByRole("img", { name: "My blue shirt" })).toBeVisible();
  await page.getByRole("button", { name: /My blue shirt/ }).click();
  await page.getByRole("button", { name: "Remove piece", exact: true }).click();
  await page.getByRole("button", { name: "Confirm deletion" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("moodrobe-v1")).items.length,
    ),
  ).toBe(16);
});
test("real local neural inference ranks owned outfits and trains on feedback", async ({
  page,
}) => {
  test.setTimeout(120000);
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page
    .getByLabel("What does today look like?")
    .fill(
      "A formal presentation and an evening dinner. Tailored, confident and polished.",
    );
  await page.getByRole("button", { name: "Create with local AI" }).click();
  await expect(
    page.getByRole("button", { name: "Refresh neural edit" }),
  ).toBeVisible({ timeout: 90000 });
  await expect(page.locator(".engine-tag.neural")).toHaveCount(3);
  await page.getByRole("button", { name: "Open The everyday anchor" }).click();
  await expect(
    page.getByText("384-dimensional sentence embeddings", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "That’s me", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Refresh neural edit" }).click();
  await expect(
    page.getByRole("button", { name: "Refresh neural edit" }),
  ).toBeEnabled({ timeout: 90000 });
  await nav(page, "Inside the AI").click();
  await expect(
    page.getByText("LAST TRAINING LOSS", { exact: false }),
  ).toBeVisible();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("moodrobe-v1")),
  );
  expect(s.feedback[0].vector.length).toBe(384);
  expect(s.feedback[0].vector.every(Number.isFinite)).toBe(true);
  expect(requests.some((u) => u.includes("model_quantized.onnx"))).toBe(true);
  expect(
    requests.filter(
      (u) =>
        !u.startsWith("http://127.0.0.1") &&
        !u.startsWith("blob:") &&
        !u.startsWith("data:"),
    ),
  ).toEqual([]);
  await page
    .getByRole("checkbox", { name: /I consent to storing these comparison/ })
    .check();
  await page.getByRole("button", { name: "Start blind comparison" }).click();
  await page.getByRole("button", { name: /PROPOSAL A/ }).click();
  await expect(
    page.getByText("Choice recorded.", { exact: false }),
  ).toBeVisible();
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export comparison CSV" }).click();
  expect((await d).suggestedFilename()).toBe("moodrobe-comparisons.csv");
});
test("private backups export/import and invalid backups are rejected", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Profile and privacy" })
    .first()
    .click();
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const path = await (await d).path();
  await page.locator("input[type=file]").setInputFiles(path);
  await expect(page.getByRole("status")).toContainText("Backup imported");
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"items":[]}'),
  });
  await expect(page.getByRole("alert")).toContainText("not a valid");
  await page.getByRole("button", { name: "Delete all my local data" }).click();
  await page.getByRole("button", { name: "Confirm deletion" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "An edit needs a few pieces." }),
  ).toBeVisible();
});
test("local RR calculation and denial of camera permission recover cleanly", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Build my daily edit" }).click();
  await page.getByRole("button", { name: "Optional signals" }).click();
  await page
    .getByRole("checkbox", { name: "Consent: A moment in the mirror" })
    .check();
  await page.getByRole("button", { name: "Open local mirror" }).click();
  await expect(page.getByRole("alert")).toContainText("Camera unavailable");
  await page
    .getByRole("checkbox", { name: "Consent: Your RR intervals" })
    .check();
  await page
    .getByRole("textbox", { name: "RR intervals" })
    .fill(Array.from({ length: 20 }, (_, i) => (i % 2 ? 820 : 800)).join(","));
  await page.getByRole("button", { name: "Calculate RMSSD" }).click();
  await expect(page.getByText("20.0 ms", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save my check-in" }).click();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("moodrobe-v1")),
  );
  expect(JSON.stringify(s)).not.toContain("820,800");
});
test("both media streams stop when optional signal dialog closes", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.__tracks = [];
    navigator.mediaDevices.getUserMedia = async (c) => {
      let media;
      if (c.video) {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        canvas.getContext("2d").fillRect(0, 0, 64, 64);
        media = canvas.captureStream(1);
        window.__canvas = canvas;
      } else {
        const context = new AudioContext(),
          osc = context.createOscillator(),
          dest = context.createMediaStreamDestination();
        osc.connect(dest);
        osc.start();
        media = dest.stream;
        window.__ctx = context;
      }
      window.__tracks.push(...media.getTracks());
      return media;
    };
  });
  await page.getByRole("button", { name: "Build my daily edit" }).click();
  await page.getByRole("button", { name: "Optional signals" }).click();
  await page
    .getByRole("checkbox", { name: "Consent: A moment in the mirror" })
    .check();
  await page.getByRole("button", { name: "Open local mirror" }).click();
  await expect(page.locator("video")).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Consent: A few words to yourself" })
    .check();
  await page.getByRole("button", { name: "Record five seconds" }).click();
  await expect(
    page.getByRole("button", { name: "Recording… (5 s)" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect
    .poll(() => page.evaluate(() => window.__tracks.map((t) => t.readyState)))
    .toEqual(["ended", "ended"]);
});
test("desktop, mobile and all product screens pass automated accessibility checks", async ({
  page,
}) => {
  const failures = [];
  async function audit(screen) {
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    for (const v of r.violations)
      failures.push({
        screen,
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          reason: n.failureSummary,
        })),
      });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: "docs/moodrobe-v2-desktop.png",
    fullPage: true,
  });
  await audit("desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/moodrobe-v2-mobile.png",
    fullPage: true,
  });
  await audit("mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await nav(page, "Your wardrobe").click();
  await audit("wardrobe");
  await page.getByRole("button", { name: "Add a piece", exact: true }).click();
  await audit("add");
  await page.keyboard.press("Escape");
  await nav(page, "Wear it again").click();
  await audit("rewear");
  await nav(page, "Inside the AI").click();
  await audit("AI lab");
  await page.screenshot({ path: "docs/moodrobe-v2-lab.png", fullPage: true });
  await page
    .getByRole("button", { name: "Profile and privacy" })
    .first()
    .click();
  await audit("privacy");
  await page.keyboard.press("Escape");
  await nav(page, "Your daily edit").click();
  await page.getByRole("button", { name: "Build my daily edit" }).click();
  await audit("checkin");
  await page.getByRole("button", { name: "Optional signals" }).click();
  await audit("signals");
  expect(failures).toEqual([]);
});
