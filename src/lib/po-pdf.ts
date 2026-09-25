import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDate, formatMoney } from "@/lib/format";
import { site } from "@/lib/site";

type Snapshot = {
  name?: string;
  lot_number?: string;
  format?: string;
  size?: string;
  producer?: string;
  producer_licence?: string;
};

export type PoData = {
  po_number: string;
  created_at: string;
  status: string;
  notes: string | null;
  subtotal_cents: number;
  company: { legal_name: string; licence_type: string; licence_number: string; address: string | null; province: string };
  placed_by: string | null;
  items: { snapshot: Snapshot; quantity_units: number; unit_price_cents: number; line_total_cents: number }[];
};

const FOREST = rgb(0.12, 0.23, 0.18);
const MUTED = rgb(0.36, 0.35, 0.31);

// Standard PDF fonts only cover WinAnsi; replace characters they cannot draw.
const clean = (s: string) => s.replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/×/g, "x").replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

function text(page: PDFPage, s: string, x: number, y: number, font: PDFFont, size = 9, color = FOREST) {
  page.drawText(clean(s), { x, y, size, font, color });
}

/** Purchase order PDF (US Letter). */
export async function renderPurchaseOrder(po: PoData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Purchase order ${po.po_number}`);
  pdf.setAuthor(site.name);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);

  let page = pdf.addPage([612, 792]);
  let y = 740;

  text(page, "CannaDry", 50, y, serif, 24);
  text(page, "PURCHASE ORDER", 400, y + 4, bold, 12);
  y -= 18;
  text(page, `${site.legalName} · Health Canada licence ${site.licenceNumber}`, 50, y, font, 8, MUTED);
  text(page, po.po_number, 400, y, bold, 11);
  y -= 12;
  text(page, `${site.address} · ${site.email}`, 50, y, font, 8, MUTED);
  text(page, `Date: ${formatDate(po.created_at)}`, 400, y, font, 9);
  y -= 12;
  text(page, `Status: ${po.status}`, 400, y, font, 9);

  y -= 34;
  text(page, "BUYER", 50, y, bold, 8, MUTED);
  y -= 14;
  text(page, po.company.legal_name, 50, y, bold, 10);
  y -= 13;
  text(page, `${po.company.licence_type} · Licence ${po.company.licence_number}`, 50, y, font);
  y -= 12;
  text(page, [po.company.address, po.company.province].filter(Boolean).join(", "), 50, y, font);
  if (po.placed_by) {
    y -= 12;
    text(page, `Placed by: ${po.placed_by}`, 50, y, font);
  }

  const cols = [50, 250, 340, 420, 480, 540];
  const header = () => {
    y -= 30;
    page.drawRectangle({ x: 45, y: y - 5, width: 522, height: 18, color: rgb(0.96, 0.95, 0.93) });
    ["Product / licence holder", "Lot", "Format", "Units", "Unit price", "Total"].forEach((h, i) =>
      text(page, h, cols[i], y, bold, 8, MUTED),
    );
    y -= 18;
  };
  header();

  for (const item of po.items) {
    if (y < 110) {
      page = pdf.addPage([612, 792]);
      y = 740;
      header();
    }
    const s = item.snapshot;
    text(page, (s.name ?? "").slice(0, 38), cols[0], y, bold, 9);
    text(page, (s.lot_number ?? "").slice(0, 16), cols[1], y, font);
    text(page, (s.size ?? "").slice(0, 14), cols[2], y, font);
    text(page, item.quantity_units.toLocaleString("en-CA"), cols[3], y, font);
    text(page, formatMoney(item.unit_price_cents), cols[4], y, font);
    text(page, formatMoney(item.line_total_cents), cols[5] - 8, y, font);
    y -= 11;
    text(page, `${s.producer ?? ""} · Licence ${s.producer_licence ?? ""}`.slice(0, 60), cols[0], y, font, 7.5, MUTED);
    text(page, (s.format ?? "").slice(0, 40), cols[1], y, font, 7.5, MUTED);
    y -= 16;
    page.drawLine({ start: { x: 45, y: y + 8 }, end: { x: 567, y: y + 8 }, thickness: 0.4, color: rgb(0.72, 0.7, 0.65) });
  }

  y -= 8;
  text(page, "Subtotal (CAD)", 400, y, bold, 10);
  text(page, formatMoney(po.subtotal_cents), cols[5] - 8, y, bold, 10);
  y -= 14;
  text(page, "Taxes and excise duty are calculated on the invoice.", 330, y, font, 7.5, MUTED);

  if (po.notes) {
    y -= 28;
    text(page, "NOTES", 50, y, bold, 8, MUTED);
    y -= 13;
    text(page, po.notes.slice(0, 110), 50, y, font);
  }

  text(page, "Binding once accepted by CannaDry. Payment terms per invoice. Records kept as required under the Cannabis Act.", 50, 50, font, 7, MUTED);
  return pdf.save();
}
