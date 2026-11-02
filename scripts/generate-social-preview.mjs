import { chromium } from '@playwright/test';

// Run against the local Vite server: node scripts/generate-social-preview.mjs
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', args: ['--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5186', { waitUntil: 'networkidle' });
  await page.locator('canvas').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: `
    body { background: #eeece7; }
    header, aside, footer, .stage-bottom, .gesture, .scene-badge { display: none; }
    main { display: block; min-height: 630px; }
    .stage { width: 1200px; height: 630px; }
    .scene { inset: 50px -65px 50px 470px; }
    .stage-heading { top: 58px; left: 64px; width: 470px; }
    .stage-heading .eyebrow { color: #703f35; font-size: 14px; letter-spacing: 2px; }
    .stage-heading h1 { font-size: 86px; line-height: .98; margin: 58px 0 24px; text-transform: none; }
    .stage-heading p { max-width: 330px; font-size: 20px; line-height: 1.5; }
    .preview-footer { position: absolute; bottom: 44px; left: 64px; right: 64px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cfc9bf; padding-top: 20px; font-size: 13px; letter-spacing: 1px; color: #68645e; }
    .preview-footer b { color: #292723; font-weight: 500; }
  ` });
  await page.locator('.stage-heading').evaluate(element => {
    element.innerHTML = '<span class="eyebrow">FORME. / SHOWROOM 3D</span><h1>Votre meuble<br>prend <span>forme.</span></h1><p>Imaginez, composez, personnalisez.<br>Le design se joue en 3D.</p>';
  });
  await page.locator('.stage').evaluate(element => {
    const footer = document.createElement('div');
    footer.className = 'preview-footer';
    footer.innerHTML = '<b>RM DEV DESIGN</b><span>MOBILIER MODULAIRE · EXPÉRIENCE INTERACTIVE</span>';
    element.append(footer);
  });
  // Let the resized 3D canvas settle before exporting the final card.
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'public/social-preview.png' });
} finally {
  await browser.close();
}
