/**
 * Fills a LOCAL database with fake test data: categories, producers, products, lots with
 * sample COA PDFs, buyer companies and a few orders. All names are invented.
 *
 * Usage: npm run seed   (run `npm run db:reset` first for a clean start)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Database } from "../src/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secret = process.env.SUPABASE_SECRET_KEY!;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!/127\.0\.0\.1|localhost/.test(url) && !process.argv.includes("--force")) {
  console.error(`Refusing to seed a non-local database (${url}). Pass --force to override.`);
  process.exit(1);
}

const admin = createClient<Database>(url, secret, { auth: { persistSession: false } });

const PASSWORD = "Test-pass-2026";
const PLACEHOLDER_LICENCE = "X";

const categories = [
  { name: "Flower", slug: "flower", sort_order: 1 },
  { name: "Pre-rolls", slug: "pre-rolls", sort_order: 2 },
  { name: "Extracts", slug: "extracts", sort_order: 3 },
  { name: "Vapes", slug: "vapes", sort_order: 4 },
  { name: "Edibles", slug: "edibles", sort_order: 5 },
  { name: "Bulk", slug: "bulk", sort_order: 6 },
];

const producers = [
  { key: "cedar", name: "Cedar Hollow Growers", city: "Salt Spring Island", description: "Indoor cultivation in small rooms. Hang-dried and hand-trimmed." },
  { key: "tide", name: "Tidewater Cultivation", city: "Powell River", description: "Greenhouse cultivation using coastal climate control." },
  { key: "granite", name: "Granite Ridge Farms", city: "Kelowna", description: "Outdoor and greenhouse cultivation in the Okanagan." },
  { key: "north", name: "Northshore Craft Co.", city: "Squamish", description: "Micro-cultivation. Small batches, cured for a minimum of 21 days." },
  { key: "lake", name: "Lakeline Processing", city: "Nelson", description: "Processing: extraction, pre-rolls, vapes and edibles." },
];

type LotSeed = { lot: string; harvest?: string; packaged: string; thc: number | null; cbd: number | null; terps: [string, number][]; stock: number };
type ProductSeed = {
  producer: string; category: string; name: string; description: string; format: string; size: string;
  perCase: number; price: number; moq: number; lead: number; status?: "draft" | "published"; lots: LotSeed[];
};

const products: ProductSeed[] = [
  { producer: "cedar", category: "flower", name: "Hollow 7", description: "Indica-dominant hybrid. Dense, medium-sized buds.", format: "Dried flower, whole bud", size: "3.5 g", perCase: 24, price: 1450, moq: 48, lead: 3,
    lots: [
      { lot: "CH7-2608", harvest: "2026-07-18", packaged: "2026-08-22", thc: 24.6, cbd: 0.1, terps: [["Myrcene", 0.9], ["Caryophyllene", 0.6], ["Limonene", 0.3]], stock: 480 },
      { lot: "CH7-2609", harvest: "2026-08-15", packaged: "2026-09-12", thc: 23.1, cbd: 0.1, terps: [["Myrcene", 1.0], ["Caryophyllene", 0.5], ["Linalool", 0.2]], stock: 720 },
    ] },
  { producer: "cedar", category: "flower", name: "Hollow 12", description: "Sativa-dominant hybrid. Long, loose buds.", format: "Dried flower, whole bud", size: "7 g", perCase: 12, price: 2600, moq: 24, lead: 3,
    lots: [{ lot: "CH12-2608", harvest: "2026-07-20", packaged: "2026-08-25", thc: 21.8, cbd: 0.2, terps: [["Terpinolene", 0.8], ["Ocimene", 0.4], ["Myrcene", 0.3]], stock: 240 }] },
  { producer: "tide", category: "flower", name: "Slack Tide", description: "Balanced hybrid grown in greenhouse.", format: "Dried flower, whole bud", size: "3.5 g", perCase: 24, price: 1150, moq: 48, lead: 5,
    lots: [{ lot: "TW-ST-0826", harvest: "2026-07-02", packaged: "2026-08-10", thc: 19.4, cbd: 0.3, terps: [["Caryophyllene", 0.7], ["Humulene", 0.3], ["Pinene", 0.2]], stock: 960 }] },
  { producer: "tide", category: "flower", name: "Balance 1:1", description: "High-CBD cultivar with a near equal THC:CBD ratio.", format: "Dried flower, whole bud", size: "3.5 g", perCase: 24, price: 1250, moq: 48, lead: 5,
    lots: [{ lot: "TW-B11-0826", harvest: "2026-07-05", packaged: "2026-08-12", thc: 8.9, cbd: 9.6, terps: [["Myrcene", 0.5], ["Pinene", 0.4], ["Caryophyllene", 0.3]], stock: 36 }] },
  { producer: "granite", category: "flower", name: "Okanagan Sun 4", description: "Sativa-dominant, sun-grown.", format: "Dried flower, milled", size: "15 g", perCase: 12, price: 3900, moq: 24, lead: 7,
    lots: [{ lot: "GR-OS4-26A", harvest: "2026-06-28", packaged: "2026-08-01", thc: 18.2, cbd: 0.1, terps: [["Limonene", 0.6], ["Caryophyllene", 0.4], ["Linalool", 0.2]], stock: 360 }] },
  { producer: "north", category: "flower", name: "Stawamus", description: "Indica-dominant. Small batch, cured 28 days.", format: "Dried flower, whole bud", size: "3.5 g", perCase: 12, price: 1850, moq: 24, lead: 4,
    lots: [{ lot: "NS-STW-09", harvest: "2026-08-02", packaged: "2026-09-05", thc: 27.3, cbd: 0.1, terps: [["Caryophyllene", 1.1], ["Limonene", 0.7], ["Humulene", 0.4]], stock: 144 }] },
  { producer: "north", category: "flower", name: "Chief's Trail", description: "Sativa-dominant micro-batch.", format: "Dried flower, whole bud", size: "3.5 g", perCase: 12, price: 1800, moq: 24, lead: 4, status: "draft",
    lots: [{ lot: "NS-CT-10", harvest: "2026-08-20", packaged: "2026-09-18", thc: 25.0, cbd: 0.1, terps: [["Terpinolene", 0.9]], stock: 96 }] },
  { producer: "lake", category: "pre-rolls", name: "Hollow 7 Pre-rolls", description: "Made from Hollow 7 flower. Unbleached paper, paper tip.", format: "Pre-roll, 0.5 g × 3", size: "1.5 g", perCase: 24, price: 1100, moq: 48, lead: 5,
    lots: [{ lot: "LL-PR-H7-31", packaged: "2026-09-01", thc: 22.9, cbd: 0.1, terps: [["Myrcene", 0.8], ["Caryophyllene", 0.5]], stock: 600 }] },
  { producer: "lake", category: "pre-rolls", name: "Slack Tide Pre-rolls", description: "Made from Slack Tide flower.", format: "Pre-roll, 1 g × 1", size: "1 g", perCase: 48, price: 650, moq: 96, lead: 5,
    lots: [{ lot: "LL-PR-ST-12", packaged: "2026-08-28", thc: 18.7, cbd: 0.3, terps: [["Caryophyllene", 0.6]], stock: 1440 }] },
  { producer: "lake", category: "extracts", name: "Live Resin — Hollow 12", description: "Hydrocarbon extraction from fresh-frozen material.", format: "Live resin", size: "1 g", perCase: 20, price: 2900, moq: 20, lead: 7,
    lots: [{ lot: "LL-LR-H12-04", packaged: "2026-09-08", thc: 74.5, cbd: 0.4, terps: [["Terpinolene", 3.1], ["Ocimene", 1.2], ["Myrcene", 0.9]], stock: 200 }] },
  { producer: "lake", category: "extracts", name: "Full-spectrum CBD Oil", description: "MCT carrier oil. 1,000 mg CBD per bottle.", format: "Oil, 30 mL", size: "30 mL", perCase: 12, price: 3100, moq: 12, lead: 7,
    lots: [{ lot: "LL-CBD-30-17", packaged: "2026-08-19", thc: 0.2, cbd: 3.3, terps: [], stock: 180 }] },
  { producer: "lake", category: "vapes", name: "Slack Tide Cartridge", description: "Distillate with cannabis-derived terpenes. 510 thread.", format: "Vape cartridge", size: "1 g", perCase: 25, price: 2400, moq: 25, lead: 7,
    lots: [{ lot: "LL-VC-ST-09", packaged: "2026-09-10", thc: 88.1, cbd: 0.5, terps: [["Caryophyllene", 2.0], ["Humulene", 0.9]], stock: 300 }] },
  { producer: "lake", category: "vapes", name: "Balance 1:1 Cartridge", description: "THC and CBD distillate, 1:1.", format: "Vape cartridge", size: "0.5 g", perCase: 25, price: 1700, moq: 25, lead: 7,
    lots: [{ lot: "LL-VC-B11-03", packaged: "2026-09-03", thc: 42.0, cbd: 43.5, terps: [["Myrcene", 1.4]], stock: 20 }] },
  { producer: "lake", category: "edibles", name: "Dark Chocolate 10 mg", description: "70% dark chocolate. 10 mg THC per package, 2 pieces of 5 mg.", format: "Chocolate, 2 × 5 mg THC", size: "10 mg THC", perCase: 40, price: 550, moq: 80, lead: 10,
    lots: [{ lot: "LL-DC10-22", packaged: "2026-09-02", thc: null, cbd: null, terps: [], stock: 800 }] },
  { producer: "lake", category: "edibles", name: "Herbal Tea, CBD", description: "Unsweetened rooibos blend. 20 mg CBD per package.", format: "Tea bags, 4 × 5 mg CBD", size: "20 mg CBD", perCase: 30, price: 600, moq: 30, lead: 10,
    lots: [{ lot: "LL-TEA-08", packaged: "2026-08-30", thc: null, cbd: null, terps: [], stock: 270 }] },
  { producer: "granite", category: "bulk", name: "Okanagan Sun 4 — Bulk Flower", description: "Bulk dried flower for processing or packaging. Sold per kilogram.", format: "Bulk dried flower", size: "1 kg", perCase: 1, price: 195000, moq: 2, lead: 10,
    lots: [{ lot: "GR-BULK-OS4-A", harvest: "2026-06-28", packaged: "2026-07-30", thc: 18.2, cbd: 0.1, terps: [["Limonene", 0.6], ["Caryophyllene", 0.4]], stock: 40 }] },
  { producer: "tide", category: "bulk", name: "Trim — Mixed Cultivars", description: "Sugar and fan leaf trim for extraction. Sold per kilogram.", format: "Bulk trim", size: "1 kg", perCase: 1, price: 38000, moq: 5, lead: 7,
    lots: [{ lot: "TW-TRIM-2608", harvest: "2026-07-05", packaged: "2026-08-15", thc: 9.8, cbd: 0.4, terps: [], stock: 120 }] },
  { producer: "cedar", category: "bulk", name: "Hollow 7 — Bulk Flower", description: "Bulk dried flower. Sold per kilogram.", format: "Bulk dried flower", size: "1 kg", perCase: 1, price: 285000, moq: 1, lead: 5,
    lots: [{ lot: "CH7-BULK-09", harvest: "2026-08-15", packaged: "2026-09-12", thc: 23.1, cbd: 0.1, terps: [["Myrcene", 1.0], ["Caryophyllene", 0.5]], stock: 12 }] },
];

const companies = [
  { legal_name: "Fogline Botanicals Ltd.", licence_type: "Standard processing", licence_number: "LIC-TEST-0001", province: "British Columbia", address: "100 Test Road, Squamish, BC", contact: "Sam Rivera", email: "buyer@fogline.example", phone: "604 555 0100", status: "approved" as const },
  { legal_name: "Harbourview Processing Inc.", licence_type: "Micro-processing", licence_number: "LIC-TEST-0002", province: "Ontario", address: "22 Sample Street, Kingston, ON", contact: "Alex Chen", email: "buyer@harbourview.example", phone: "613 555 0199", status: "approved" as const },
  { legal_name: "Kettle Valley Cultivation Ltd.", licence_type: "Micro-cultivation", licence_number: "LIC-TEST-0003", province: "British Columbia", address: "5 Placeholder Lane, Grand Forks, BC", contact: "Jordan Lee", email: "buyer@kettlevalley.example", phone: "250 555 0142", status: "pending" as const },
];

async function samplePdf(title: string, lines: string[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText("SAMPLE DOCUMENT — TEST DATA ONLY", { x: 50, y: 740, size: 10, font: bold, color: rgb(0.6, 0.17, 0.12) });
  page.drawText(title, { x: 50, y: 710, size: 18, font: bold });
  lines.forEach((l, i) => page.drawText(l, { x: 50, y: 680 - i * 18, size: 11, font }));
  return Buffer.from(await pdf.save());
}

function check<T>(res: { data: T; error: unknown }, what: string): NonNullable<T> {
  if (res.error) throw new Error(`${what}: ${JSON.stringify(res.error)}`);
  return res.data as NonNullable<T>;
}

async function ensureUser(email: string, fullName: string) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = data?.users.find((u) => u.email === email);
  if (found) return found.id;
  const { data: created, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error || !created.user) throw new Error(`create ${email}: ${error?.message}`);
  return created.user.id;
}

async function signedIn(email: string, password = PASSWORD): Promise<SupabaseClient<Database>> {
  const c = createClient<Database>(url, publishable, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign in ${email}: ${error.message}`);
  return c;
}

async function main() {
  const existing = check(await admin.from("products").select("id").limit(1), "check products");
  if (existing.length) {
    console.log("Catalogue already has data. Run `npm run db:reset` first for a clean seed.");
    return;
  }

  // Staff account
  const adminId = await ensureUser("admin@cannadry.example", "Dana Staff");
  await admin.auth.admin.updateUserById(adminId, { password: PASSWORD });
  check(await admin.from("profiles").upsert({ id: adminId, full_name: "Dana Staff", email: "admin@cannadry.example", is_admin: true }), "admin profile");
  const staff = await signedIn("admin@cannadry.example");

  // Catalogue is written as the staff user so the audit log records who created it.
  const cats = check(await staff.from("categories").insert(categories).select("id, slug"), "categories");
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const prods = check(
    await staff
      .from("producers")
      .insert(producers.map(({ name, city, description }) => ({ name, city, description, province: "British Columbia", licence_number: PLACEHOLDER_LICENCE })))
      .select("id, name"),
    "producers",
  );
  const producerId = Object.fromEntries(producers.map((p) => [p.key, prods.find((x) => x.name === p.name)!.id]));

  for (const p of products) {
    const product = check(
      await staff
        .from("products")
        .insert({
          producer_id: producerId[p.producer], category_id: catId[p.category], name: p.name, description: p.description,
          format: p.format, size_label: p.size, units_per_case: p.perCase, price_per_unit_cents: p.price,
          min_order_units: p.moq, lead_time_days: p.lead, status: "draft",
        })
        .select("id")
        .single(),
      `product ${p.name}`,
    );
    for (const l of p.lots) {
      const coaPath = `${product.id}/${l.lot}.pdf`;
      const pdf = await samplePdf(`Certificate of Analysis — ${p.name}`, [
        `Lot: ${l.lot}`,
        `Packaged: ${l.packaged}${l.harvest ? `   Harvested: ${l.harvest}` : ""}`,
        `Total THC: ${l.thc ?? "see package"}${l.thc != null ? " %" : ""}`,
        `Total CBD: ${l.cbd ?? "see package"}${l.cbd != null ? " %" : ""}`,
        `Terpenes: ${l.terps.map(([n, v]) => `${n} ${v}%`).join(", ") || "not tested"}`,
        "Microbials, heavy metals, pesticides: pass (sample values)",
        "Laboratory: Sample Analytical Lab (fictional)",
      ]);
      check(await staff.storage.from("coas").upload(coaPath, pdf, { contentType: "application/pdf" }), `coa ${l.lot}`);
      check(
        await staff.from("product_lots").insert({
          product_id: product.id, lot_number: l.lot, harvest_date: l.harvest ?? null, packaging_date: l.packaged,
          thc_pct: l.thc, cbd_pct: l.cbd, terpenes: l.terps.map(([name, pct]) => ({ name, pct })), coa_path: coaPath, stock_units: l.stock,
        }),
        `lot ${l.lot}`,
      );
    }
    if (p.status !== "draft") check(await staff.from("products").update({ status: "published" }).eq("id", product.id), `publish ${p.name}`);
  }
  console.log(`Catalogue: ${products.length} products`);

  // Buyer companies (created through the same function the request form uses)
  const licencePdf = await samplePdf("Cannabis Licence (sample)", ["This is a fictional licence document used for testing."]);
  for (const c of companies) {
    const userId = await ensureUser(c.email, c.contact);
    const companyId = crypto.randomUUID();
    const path = `${companyId}/licence-sample.pdf`;
    check(await admin.storage.from("licences").upload(path, licencePdf, { contentType: "application/pdf" }), "licence upload");
    check(
      await admin.rpc("create_access_request", {
        p_user_id: userId, p_company_id: companyId, p_legal_name: c.legal_name, p_licence_type: c.licence_type,
        p_licence_number: c.licence_number, p_province: c.province, p_address: c.address, p_contact_name: c.contact,
        p_contact_email: c.email, p_contact_phone: c.phone, p_document_path: path, p_document_name: "licence-sample.pdf",
      }),
      `request ${c.legal_name}`,
    );
    if (c.status === "approved") {
      check(await staff.rpc("review_company", { p_company_id: companyId, p_decision: "approved", p_note: "Licence verified (test data)" }), "approve");
    }
  }
  console.log(`Companies: ${companies.length}`);

  // A few orders placed through the real checkout function.
  const lots = check(
    await admin.from("product_lots").select("id, lot_number, stock_units, product:products(units_per_case, min_order_units, status)").order("lot_number"),
    "lots",
  );
  const orderable = lots.filter(
    (l) => l.product?.status === "published" && l.stock_units >= 4 * Math.max(l.product.min_order_units, l.product.units_per_case),
  );
  const buyerOrders: { email: string; picks: number[]; notes?: string; to: ("accepted" | "shipped" | "delivered")[] }[] = [
    { email: "buyer@fogline.example", picks: [0, 3], notes: "Deliver to loading bay B.", to: ["accepted", "shipped", "delivered"] },
    { email: "buyer@fogline.example", picks: [5, 8], to: ["accepted"] },
    { email: "buyer@harbourview.example", picks: [1, 10, 12], to: [] },
  ];
  for (const o of buyerOrders) {
    const buyer = await signedIn(o.email);
    const profile = check(await buyer.from("profiles").select("id, company_id").single(), "buyer profile");
    for (const i of o.picks) {
      const lot = orderable[i % orderable.length];
      const qty = Math.max(lot.product!.min_order_units, lot.product!.units_per_case);
      check(await buyer.from("cart_items").insert({ user_id: profile.id, company_id: profile.company_id!, lot_id: lot.id, quantity_units: qty }), "cart");
    }
    const orderId = check(await buyer.rpc("place_order", { p_notes: o.notes }), "place order");
    for (const s of o.to) check(await staff.rpc("set_order_status", { p_order_id: orderId, p_status: s }), `order ${s}`);
  }
  console.log(`Orders: ${buyerOrders.length}`);

  console.log(`
Test accounts (password for buyers: ${PASSWORD})
  Staff:            admin@cannadry.example   (password: ${PASSWORD})
  Buyer (approved): buyer@fogline.example
  Buyer (approved): buyer@harbourview.example
  Buyer (pending):  buyer@kettlevalley.example`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
