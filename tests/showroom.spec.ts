import { test, expect } from "@playwright/test";
test("formats, matériaux, décoration automatique et PDF sur mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "164 cm" }).click();
  await expect(page.getByText("164 × 84 × 38")).toBeVisible();
  await page.getByRole("button", { name: "Finitions" }).click();
  await page
    .getByRole("button", { name: "Structure Chêne clair", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Façades Chêne|Façades Noyer/ }),
  ).toHaveCount(0);
  await page.waitForTimeout(2000);
  expect(
    await page
      .locator("canvas")
      .evaluate((c) =>
        (c as HTMLCanvasElement).getContext("webgl2")?.isContextLost(),
      ),
  ).toBe(false);
  await page.screenshot({
    path: "test-results/showroom-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Pieds Aluminium", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pieds Aluminium", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Détails" }).click();
  await expect(
    page.getByRole("button", { name: "Pieds Aluminium", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Façades fermées" }).uncheck();
  await page.getByRole("checkbox", { name: "Objets décoratifs" }).uncheck();
  await page.getByRole("checkbox", { name: "Objets décoratifs" }).check();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Format" }).click();
  await page.getByRole("button", { name: "84 cm" }).click();
  await page.getByRole("button", { name: "4 niveaux" }).click();
  await expect(page.getByText("84 × 156 × 38")).toBeVisible();
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: "test-results/showroom-mobile.png",
    fullPage: true,
  });
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Fiche de configuration PDF" })
    .click();
  const file = await event;
  expect(file.suggestedFilename()).toMatch(/FORME.*pdf/);
  await file.saveAs("test-results/forme.pdf");
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(
    page.getByRole("button", { name: /Sauvegarder|Importer|Objets/ }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
