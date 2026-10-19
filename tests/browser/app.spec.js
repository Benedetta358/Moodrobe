import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve, reject) => {
      const r = indexedDB.open("moodrobe-private", 1);
      r.onsuccess = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains("state")) {
          db.close();
          resolve();
          return;
        }
        const t = db.transaction("state", "readwrite");
        t.objectStore("state").clear();
        t.oncomplete = () => {
          db.close();
          resolve();
        };
        t.onerror = reject;
      };
      r.onerror = reject;
    });
  });
  await page.reload();
});
test("daily journey: check-in, explain, save, plan, wear and persistence", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(
    page.getByRole("heading", {
      name: "Buongiorno, Benedetta. Oggi, come ti senti?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Piena di energia" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Cosa ti aspetta?").selectOption("Lavoro / studio");
  await dialog.getByLabel("Temperatura esterna").fill("12");
  await dialog.getByRole("button", { name: "Trova il mio outfit" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Esplora Il tuo equilibrio" }).click();
  await expect(
    page.getByRole("heading", { name: "Perché questo look?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByRole("button", { name: "Pianifica", exact: true }).click();
  await page.getByRole("button", { name: "Pianifica outfit" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "I tuoi outfit" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Il tuo equilibrio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "In agenda" }).click();
  await expect(
    page.getByRole("heading", { name: "Il tuo equilibrio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lo indosso", exact: true }).click();
  await page.getByRole("button", { name: "Diario" }).click();
  await expect(
    page.getByRole("heading", { name: "Il tuo equilibrio" }),
  ).toBeVisible();
  await page.reload();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("moodrobe-v1")),
  );
  expect(state.saved).toHaveLength(1);
  expect(state.history).toHaveLength(1);
  expect(state.plans).toHaveLength(0);
  expect(state.checkin.mood).toBe("bright");
  expect(errors).toEqual([]);
});
test("wardrobe: add, search, edit availability, delete", async ({ page }) => {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Guardaroba", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aggiungi un capo", exact: true })
    .click();
  await page.getByLabel("Nome del capo").fill("Camicia personale");
  await page.getByLabel("Categoria", { exact: true }).selectOption("Top");
  await page
    .getByRole("button", { name: "Aggiungi al mio guardaroba" })
    .click();
  await page.getByPlaceholder("Cerca un capo…").fill("personale");
  await page.getByRole("button", { name: /Camicia personale/ }).click();
  await page
    .getByRole("checkbox", { name: /Disponibile per gli outfit/ })
    .uncheck();
  await page.getByRole("button", { name: "Salva modifiche" }).click();
  await expect(
    page.getByText("Non disponibile", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Camicia personale/ }).click();
  await page.getByRole("button", { name: "Rimuovi dal guardaroba" }).click();
  await page.getByRole("button", { name: "Conferma eliminazione" }).click();
  await expect(
    page.getByRole("button", { name: /Camicia personale/ }),
  ).toHaveCount(0);
});
test("privacy: reject invalid backup and reset without restoring demo", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Profilo e privacy" }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"items":[]}'),
  });
  await expect(page.getByRole("alert")).toContainText("non è un backup");
  await page.getByRole("button", { name: "Elimina tutti i miei dati" }).click();
  await page.getByRole("button", { name: "Conferma eliminazione" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Partiamo dal tuo guardaroba." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("moodrobe-v1")).items.length,
    ),
  ).toBe(0);
});
test("consented local comparison records and exports real choices", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Il progetto", exact: false })
    .first()
    .click();
  await page.getByRole("checkbox", { name: /Acconsento a salvare/ }).check();
  await page.getByRole("button", { name: "Avvia il confronto" }).click();
  await page.getByRole("button", { name: /PROPOSTA A/ }).click();
  await expect(
    page.getByRole("heading", { name: "Scelta registrata." }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Esporta CSV" }).click();
  expect((await download).suggestedFilename()).toBe("moodrobe-pilot.csv");
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("moodrobe-v1")),
  );
  expect(state.pilot).toHaveLength(1);
  expect(typeof state.pilot[0].moodPreferred).toBe("boolean");
});
test("keyboard modal closes on Escape and restores focus", async ({ page }) => {
  const btn = page.getByRole("button", { name: "In cerca di calma" });
  await btn.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(btn).toBeFocused();
});
test("desktop and mobile visual layout, accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: "docs/moodrobe-desktop.png", fullPage: true });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("navigation")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/moodrobe-mobile.png", fullPage: true });
  const mobile = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(mobile.violations).toEqual([]);
});

test("photo upload, backup export/import and IndexedDB image persistence", async ({
  page,
}) => {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Guardaroba", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aggiungi un capo", exact: true })
    .click();
  const png = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 300;
      c.height = 400;
      const x = c.getContext("2d");
      x.fillStyle = "#9ca98c";
      x.fillRect(0, 0, 300, 400);
      return c.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "test-photo.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.getByLabel("Nome del capo").fill("Foto personale");
  await expect(page.getByAltText("Anteprima capo")).toBeVisible();
  await page
    .getByRole("button", { name: "Aggiungi al mio guardaroba" })
    .click();
  await expect(
    page.getByRole("button", { name: /Foto personale/ }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Guardaroba", exact: true })
    .click();
  await expect(page.getByRole("img", { name: "Foto personale" })).toBeVisible();
  await page.getByRole("button", { name: "Profilo e privacy" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Esporta backup" }).click();
  const downloaded = await downloadEvent;
  const path = await downloaded.path();
  await page.locator("input[type=file]").setInputFiles(path);
  await expect(page.getByRole("status")).toContainText("Backup importato");
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("moodrobe-v1")),
  );
  expect(state.items).toHaveLength(17);
  expect(state.consents.face).toBe(false);
});

test("optional signals: permission refusal is recoverable and RR input is ephemeral", async ({
  page,
}) => {
  await page.getByRole("button", { name: "In cerca di calma" }).click();
  await page.getByRole("button", { name: "Segnali facoltativi" }).click();
  await page
    .getByRole("checkbox", { name: "Consenso Specchio consapevole" })
    .check();
  await page.getByRole("button", { name: "Attiva lo specchio" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Fotocamera non disponibile",
  );
  await page.getByRole("checkbox", { name: "Consenso Intervalli RR" }).check();
  await page
    .getByRole("textbox", { name: "Intervalli RR" })
    .fill(
      Array.from({ length: 20 }, (_, i) => (i % 2 ? "820" : "800")).join(","),
    );
  await page.getByRole("button", { name: "Calcola RMSSD" }).click();
  await expect(page.getByText("20.0 ms", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Trova il mio outfit" }).click();
  await page.reload();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("moodrobe-v1")),
  );
  expect(JSON.stringify(state)).not.toContain("820,800");
  expect(state.checkin.source).toBe("self-report");
});

test("accessibility across wardrobe, impact, project and dialogs", async ({
  page,
}) => {
  const failures = [];
  async function check(label) {
    await page.evaluate(() =>
      Promise.all(
        document.getAnimations().map((a) => a.finished.catch(() => {})),
      ),
    );
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    for (const v of r.violations)
      failures.push({
        screen: label,
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      });
  }
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Guardaroba", exact: true })
    .click();
  await check("wardrobe");
  await page
    .getByRole("button", { name: "Aggiungi un capo", exact: true })
    .click();
  await check("add garment");
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Seconda vita" })
    .click();
  await check("impact");
  await page
    .getByRole("button", { name: "Il progetto", exact: false })
    .first()
    .click();
  await check("project");
  await page.getByRole("button", { name: "Profilo e privacy" }).click();
  await check("settings");
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Il tuo oggi" })
    .click();
  await page.getByRole("button", { name: "In cerca di calma" }).click();
  await check("checkin");
  await page.getByRole("button", { name: "Segnali facoltativi" }).click();
  await check("signals");
  await page.keyboard.press("Escape");
  await page.goto("/en.html");
  await expect(
    page.getByRole("heading", {
      name: "A wardrobe that starts with how you feel.",
    }),
  ).toBeVisible();
  await check("English brief");
  expect(failures).toEqual([]);
});

test("camera and microphone tracks both stop when a shared session closes", async ({
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
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const destination = context.createMediaStreamDestination();
        oscillator.connect(destination);
        oscillator.start();
        media = destination.stream;
        window.__audioContext = context;
      }
      window.__tracks.push(...media.getTracks());
      return media;
    };
  });
  await page.getByRole("button", { name: "In cerca di calma" }).click();
  await page.getByRole("button", { name: "Segnali facoltativi" }).click();
  await page
    .getByRole("checkbox", { name: "Consenso Specchio consapevole" })
    .check();
  await page.getByRole("button", { name: "Attiva lo specchio" }).click();
  await expect(page.locator("video")).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Consenso Una parola per te" })
    .check();
  await page.getByRole("button", { name: "Registra la tua voce" }).click();
  await expect(
    page.getByRole("button", { name: "Registrazione… (5 s)" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect
    .poll(() => page.evaluate(() => window.__tracks.map((t) => t.readyState)))
    .toEqual(["ended", "ended"]);
});
