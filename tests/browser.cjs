const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("fs");
const assert = require("node:assert/strict");
(async () => {
  fs.mkdirSync("tmp", { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:4173/");
  await page.waitForLoadState("networkidle");
  const results = [];
  for (const width of [320, 375, 430, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({ path: `tmp/site-${width}.png`, fullPage: true });
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      bad: [...document.querySelectorAll("body *")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.right > innerWidth + 1 &&
            getComputedStyle(el).position !== "absolute"
          );
        })
        .map((el) => el.tagName + "." + el.className),
    }));
    assert.ok(layout.scroll <= width, JSON.stringify(layout));
    results.push({ width, overflow: false });
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole("button", { name: /Menu/ }).click();
  assert.equal(
    await page.locator(".menu-toggle").getAttribute("aria-expanded"),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator(".menu-toggle").getAttribute("aria-expanded"),
    "false",
  );
  for (const id of [
    "home",
    "meet",
    "experience",
    "why",
    "board",
    "ready",
    "endorsements",
    "donations",
    "contact",
  ]) {
    await page.getByRole("button", { name: /Menu/ }).click();
    await page.locator(`.site-nav a[href="#${id}"]`).click();
    await page.waitForTimeout(650);
    assert.equal(
      await page.locator(".menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    assert.equal(
      await page
        .locator(`.site-nav a[href="#${id}"]`)
        .getAttribute("aria-current"),
      "location",
    );
    const top = await page
      .locator("#" + id)
      .evaluate((el) => el.getBoundingClientRect().top);
    assert.ok(id === "home" || top >= 76, `obscured ${id} ${top}`);
  }
  await page.locator(".back-top").click();
  await page.waitForFunction(() => scrollY < 150);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("Tab");
  await page.goto("http://127.0.0.1:4173/#privacy");
  await page.waitForTimeout(50);
  assert.equal(await page.locator("#privacy").getAttribute("open"), "");
  const nojs = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 900 },
  });
  await nojs.goto("http://127.0.0.1:4173/");
  assert.equal(await nojs.locator(".site-nav").isVisible(), true);
  assert.equal(await nojs.locator("main > section").count(), 9);
  await nojs.close();
  assert.deepEqual(
    errors,
    [],
    "No unexpected console errors before intentionally simulated service failure",
  );
  // Exercise browser validation and actual UI success/failure with a simulated Turnstile widget and API only.
  await page.route("**/js/endorsements.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: fs
        .readFileSync("public/js/endorsements.js", "utf8")
        .replace(
          /const TURNSTILE_SITE_KEY = ["']{2};/,
          "const TURNSTILE_SITE_KEY = 'test-sitekey';",
        ),
    }),
  );
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile={render(el,opts){window.testOpts=opts;opts.callback('test-token');return 0},reset(){window.testOpts.callback('fresh-test-token')}};window.onCampaignTurnstileReady();`,
    }),
  );
  await page.reload();
  await page.locator("#endorsement-submit").click();
  assert.ok(await page.locator("#name-error").textContent());
  await page.locator("#name").fill("Test Person");
  await page.locator("#email").fill("invalid");
  await page.locator("#consent").check();
  await page.locator("#endorsement-submit").click();
  assert.ok(await page.locator("#email-error").textContent());
  await page.locator("#email").fill("test@example.com");
  await page.route("**/api/endorsement", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"ok":false}',
    }),
  );
  await page.locator("#endorsement-submit").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#form-status")
      .textContent.includes("could not confirm"),
  );
  assert.equal(await page.locator("#name").inputValue(), "Test Person");
  await page.unroute("**/api/endorsement");
  await page.route("**/api/endorsement", (route) =>
    route.fulfill({ contentType: "application/json", body: '{"ok":true}' }),
  );
  await page.locator("#endorsement-submit").click();
  await page.waitForFunction(() =>
    document.querySelector("#form-status").textContent.startsWith("Thank you."),
  );
  assert.equal(await page.locator("#name").inputValue(), "");
  assert.equal(await page.locator(".endorser strong").textContent(), "[Name]");
  const report = {
    responsive: results,
    consoleErrors: errors,
    checks: [
      "nine navigation anchors",
      "sticky heading offsets",
      "current-section highlighting",
      "mobile menu and Escape",
      "back to top",
      "reduced motion",
      "no-JS navigation and content",
      "required name and email validation",
      "API failure preserves entries",
      "simulated API success with exact thank-you",
      "no public automatic endorsement",
    ],
  };
  fs.writeFileSync("tmp/browser-results.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
