/**
 * WCAG 2.1 AA scan of every page type with axe-core, as visitor, buyer and staff.
 * Requires a running app with seed data: `npm run seed && npm run build && npm start`.
 * Usage: node scripts/check-accessibility.mjs [baseUrl]
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const BASE = process.argv[2] ?? "http://localhost:3000";
const PASSWORD = "Test-pass-2026";

async function context(browser, email, viewport) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addCookies([{ name: "cd_age_ok", value: "1", url: BASE }]);
  if (email) {
    const p = await ctx.newPage();
    await p.goto(`${BASE}/login`);
    await p.getByLabel("Email").fill(email);
    await p.getByLabel("Password").fill(PASSWORD);
    await p.getByRole("button", { name: "Sign in" }).click();
    await p.waitForURL((u) => !u.pathname.startsWith("/login"));
    await p.close();
  }
  return ctx;
}

async function firstHref(page, path, selector) {
  await page.goto(BASE + path);
  return page.locator(selector).first().getAttribute("href");
}

const browser = await chromium.launch();
let failures = 0;
for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  const anonCtx = await browser.newContext({ viewport });
  const buyerCtx = await context(browser, "buyer@fogline.example", viewport);
  const adminCtx = await context(browser, "admin@cannadry.example", viewport);
  const pendingCtx = await context(browser, "buyer@kettlevalley.example", viewport);

  const bp = await buyerCtx.newPage();
  const product = await firstHref(bp, "/shop", 'a[href^="/shop/products/"]');
  const producer = await firstHref(bp, product, 'a[href^="/shop/producers/"]');
  const order = await firstHref(bp, "/shop/orders", 'a[href^="/shop/orders/"]');
  const ap = await adminCtx.newPage();
  const aOrder = await firstHref(ap, "/admin/orders", 'td a[href^="/admin/orders/"]');
  const aProduct = await firstHref(ap, "/admin/products", 'a[href^="/admin/products/"]:not([href$="/new"])');
  const aCompany = await firstHref(ap, "/admin/companies", 'a[href^="/admin/companies/"]');

  const plan = [
    [anonCtx, ["/age-check", "/", "/how-it-works", "/about", "/contact", "/privacy", "/terms", "/request-access", "/login", "/forgot-password"]],
    [pendingCtx, ["/pending"]],
    [buyerCtx, ["/shop", product, producer, "/shop/cart", "/shop/orders", order, "/account"]],
    [adminCtx, ["/admin", "/admin/orders", aOrder, "/admin/products", aProduct, "/admin/products/new", "/admin/producers", "/admin/categories", "/admin/requests", "/admin/companies", aCompany, "/admin/audit"]],
  ];

  for (const [ctx, paths] of plan) {
    const page = await ctx.newPage();
    for (const path of paths) {
      if (path === "/age-check") await ctx.clearCookies();
      await page.goto(BASE + path);
      // Open collapsed sections so their forms are checked too.
      await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
      await page.addScriptTag({ content: AXE });
      const result = await page.evaluate(() =>
        window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }),
      );
      const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical" || v.tags.some((t) => t.startsWith("wcag")));
      const label = `${viewport.width}px ${path}`;
      if (bad.length) {
        failures += bad.length;
        console.log(`✗ ${label}`);
        for (const v of bad) console.log(`   ${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      } else {
        console.log(`✓ ${label}`);
      }
      if (path === "/age-check") await ctx.addCookies([{ name: "cd_age_ok", value: "1", url: BASE }]);
    }
  }
  for (const c of [anonCtx, buyerCtx, adminCtx, pendingCtx]) await c.close();
}
await browser.close();
console.log(failures ? `\n${failures} issue(s) found.` : "\nNo WCAG 2.1 A/AA violations found.");
process.exit(failures ? 1 : 0);
