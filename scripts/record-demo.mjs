import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("tmp/video", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: "tmp/video", size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
const start = Date.now();
let captions = [];
async function caption(t) {
  captions.push({ at: (Date.now() - start) / 1000, text: t });
  await page.evaluate((t) => {
    let x = document.getElementById("recording-caption");
    if (!x) {
      x = document.createElement("div");
      x.id = "recording-caption";
      document.body.append(x);
    }
    x.textContent = t;
    x.style =
      "position:fixed;bottom:14px;left:10%;width:80%;background:#172722;color:white;padding:14px 18px;z-index:100000;font:16px Arial;text-align:center;border-radius:5px;box-shadow:0 2px 16px #0003;pointer-events:none";
  }, t);
}
async function until(sec) {
  await page.waitForTimeout(Math.max(0, sec * 1000 - (Date.now() - start)));
}
try {
  await page.goto("http://127.0.0.1:5173/review.html");
  await caption(
    "Moodrobe / Engineering walkthrough with sample data. User validation is pending.",
  );
  await until(8);
  await page.goto("http://127.0.0.1:5173/?demo=1");
  await caption(
    "A separate sample session lets reviewers try the product without changing a personal wardrobe.",
  );
  await until(15);
  await page
    .getByRole("button", { name: /Set your mood and occasion/ })
    .click();
  await caption(
    "Mood is self-reported. Set the occasion and context; no emotion diagnosis is claimed.",
  );
  await page.getByRole("button", { name: "Feeling energised" }).click();
  await page.getByLabel("What’s the occasion?").selectOption("Work / campus");
  await until(23);
  await page.getByRole("button", { name: "Save my check-in" }).click();
  await page
    .getByLabel("What does today look like?")
    .fill(
      "A creative day on campus, comfortable denim, a light cotton shirt and white sneakers.",
    );
  await caption(
    "A pretrained sentence encoder ranks combinations from available wardrobe pieces, locally in the browser.",
  );
  await page.getByRole("button", { name: "Create with local AI" }).click();
  await page
    .getByRole("button", { name: "Refresh neural edit" })
    .waitFor({ timeout: 60000 });
  await caption(
    "These are real neural recommendations. Photos illustrate the pieces; garment descriptions are the model input.",
  );
  await until(43);
  await page.getByRole("button", { name: "Open The everyday anchor" }).click();
  await caption(
    "Inspect the exact garments, save a look and record preference feedback.",
  );
  await page.getByRole("button", { name: "Save edit", exact: true }).click();
  await until(52);
  await page
    .getByRole("button", { name: "Wear it today", exact: true })
    .click();
  await caption(
    "Only a recorded wear creates a diary event. Sample activity is not evidence from real participants.",
  );
  await until(62);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: /Open the model and limitations/ })
    .click();
  await caption(
    "The Lab explains the hybrid model, local learning, attribution and limitations.",
  );
  await until(72);
  await page
    .getByText("A usable study, before a claim.")
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  await caption(
    "A consented usability protocol and local results analyser are ready. No results have been preloaded.",
  );
  await until(81);
  await page.goto("http://127.0.0.1:5173/review.html");
  await caption(
    "Review the working demo, two-page case study and protocol. Next: collect real observations and iterate.",
  );
  await page.screenshot({ path: "public/application/demo-poster.png" });
  await until(90);
  await context.close();
  let video = await page.video().path();
  await writeFile("tmp/video/path.txt", video);
  let vtt = "WEBVTT\n\n",
    md =
      "# Moodrobe: 90-second walkthrough\n\nSilent recording of the real product using sample data. No participant results are shown.\n\n";
  const stamp = (s) =>
    new Date(Math.round(s * 1000)).toISOString().slice(11, 23);
  captions.forEach((c, i) => {
    vtt += `${stamp(c.at)} --> ${stamp(captions[i + 1]?.at ?? 90)}\n${c.text}\n\n`;
    md += `- ${Math.floor(c.at)}s: ${c.text}\n`;
  });
  await writeFile("public/application/demo.vtt", vtt);
  await writeFile("public/application/demo-transcript.md", md);
  console.log(video);
} finally {
  await browser.close();
}
