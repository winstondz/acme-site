// One-off generator: creates the dummy documents in public/files/ and writes expected.json.
// Run with: npm run generate   (reads data/reports.ts directly, Node strips the types)
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { DOCS, QUARTER_NAMES, TYPE_LABELS, findDoc } from "../data/reports.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filesDir = path.join(root, "public", "files");

// Small deterministic PRNG so regenerated files have stable numbers.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function figures(doc) {
  const r = rng(doc.year * 10 + doc.quarter);
  const revenue = Math.round(180 + r() * 60 + (doc.year - 2022) * 15 + doc.quarter * 4);
  const costs = Math.round(revenue * (0.62 + r() * 0.08));
  return { revenue, costs, profit: revenue - costs, eps: ((revenue - costs) / 52).toFixed(2) };
}

const label = (d) => `Q${d.quarter} ${d.year}`;
const title = (d) => `Acme Corp - ${label(d)} ${TYPE_LABELS[d.type]}`;

async function writePdf(doc, file) {
  const f = figures(doc);
  const pdf = await PDFDocument.create();
  pdf.setTitle(title(doc));
  pdf.setCreationDate(new Date(Date.UTC(doc.year, doc.quarter * 3 - 1, 28)));
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText(title(doc), { x: 56, y: 720, size: 20, font: bold, color: rgb(0.1, 0.2, 0.4) });
  const lines =
    doc.type === "press"
      ? [
          `Acme Corp announces results for the ${QUARTER_NAMES[doc.quarter].toLowerCase()} quarter of ${doc.year}.`,
          `Revenue was $${f.revenue}M and net income was $${f.profit}M.`,
          "Acme Corp is a fictional company; this document is dummy test data.",
        ]
      : [
          `Reporting period: ${QUARTER_NAMES[doc.quarter]} Quarter ${doc.year}`,
          `Revenue: $${f.revenue}M`,
          `Operating costs: $${f.costs}M`,
          `Net income: $${f.profit}M`,
          `Earnings per share: $${f.eps}`,
          "",
          "Acme Corp is a fictional company; this document is dummy test data.",
        ];
  lines.forEach((t, i) => page.drawText(t, { x: 56, y: 680 - i * 22, size: 12, font }));
  await writeFile(file, await pdf.save());
}

async function writeXlsx(doc, file) {
  const f = figures(doc);
  const wb = new ExcelJS.Workbook();
  wb.created = new Date(Date.UTC(doc.year, doc.quarter * 3 - 1, 28));
  const ws = wb.addWorksheet(`${label(doc)} Income Statement`);
  ws.addRows([
    ["Acme Corp", label(doc)],
    ["Line item", "USD millions"],
    ["Revenue", f.revenue],
    ["Operating costs", f.costs],
    ["Net income", f.profit],
  ]);
  await wb.xlsx.writeFile(file);
}

async function writeCsv(doc, file) {
  const r = rng(doc.year * 100 + doc.quarter);
  const rows = ["date,close,volume"];
  let price = 40 + (doc.year - 2022) * 5 + r() * 5;
  const start = Date.UTC(doc.year, (doc.quarter - 1) * 3, 1);
  for (let i = 0; i < 60; i++) {
    price = Math.max(5, price + (r() - 0.48) * 1.5);
    const date = new Date(start + i * 86400000 * 1.5).toISOString().slice(0, 10);
    rows.push(`${date},${price.toFixed(2)},${Math.round(1e6 + r() * 5e5)}`);
  }
  await writeFile(file, rows.join("\n") + "\n");
}

async function writePptx(doc, file) {
  const f = figures(doc);
  const pres = new PptxGenJS();
  pres.title = title(doc);
  const s1 = pres.addSlide();
  s1.addText(title(doc), { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 28, bold: true });
  const s2 = pres.addSlide();
  s2.addText(`Revenue $${f.revenue}M | Net income $${f.profit}M | EPS $${f.eps}`, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1,
    fontSize: 20,
  });
  await pres.writeFile({ fileName: file });
}

const writers = { earnings: writePdf, press: writePdf, financials: writeXlsx, stock: writeCsv, presentation: writePptx };
const sha256 = async (file) => createHash("sha256").update(await readFile(file)).digest("hex");

await rm(filesDir, { recursive: true, force: true });

// Pass 1: real documents. Pass 2: mirrors (byte-identical copies).
for (const doc of DOCS) {
  if (doc.kind === "broken" || doc.kind === "external" || doc.kind === "mirror") continue;
  const dir = path.join(filesDir, String(doc.year));
  await mkdir(dir, { recursive: true });
  await writers[doc.type](doc, path.join(dir, doc.filename));
}
for (const doc of DOCS.filter((d) => d.kind === "mirror")) {
  const original = DOCS.find((d) => d.id === doc.mirrorOf);
  await copyFile(
    path.join(filesDir, String(original.year), original.filename),
    path.join(filesDir, String(doc.year), doc.filename),
  );
}

// Test oracle for the agent. `download` = must be saved, `optional` = acceptable extra,
// `refused` = must not be downloaded (off-domain), `broken` = link 404s, must be reported.
const entry = async (d) => ({
  id: d.id,
  filename: d.filename,
  url: encodeURI(d.href),
  sha256: d.kind === "ok" || d.kind === "mirror" ? await sha256(path.join(filesDir, String(d.year), d.filename)) : null,
});
const byQuarter = (y, q) => DOCS.filter((d) => d.year === y && d.quarter === q);
const request = async (text, startUrl, { download = [], optional = [], refused = [], broken = [] }) => ({
  request: text,
  startUrl,
  download: await Promise.all(download.map(entry)),
  optional: await Promise.all(optional.map(entry)),
  refused: await Promise.all(refused.map(entry)),
  broken: await Promise.all(broken.map(entry)),
});

const q1_2025 = byQuarter(2025, 1);
const press2023 = DOCS.filter((d) => d.year === 2023 && d.type === "press");
const expected = [
  await request("Download the Q3 2024 earnings report", "/investors", { download: [findDoc(2024, 3, "earnings")] }),
  await request("Download all Excel financial statements for 2023", "/investors", {
    download: DOCS.filter((d) => d.year === 2023 && d.type === "financials"),
  }),
  await request("Download everything for Q1 2025", "/investors", {
    download: q1_2025.filter((d) => d.kind === "ok"),
    refused: q1_2025.filter((d) => d.kind === "external"),
  }),
  await request("Download the Q2 2024 stock price data", "/investors", { broken: [findDoc(2024, 2, "stock")] }),
  await request("Download the Q4 2022 earnings report", "/investors", { download: [findDoc(2022, 4, "earnings")] }),
  await request("Download all press releases for 2023", "/investors", {
    download: press2023.filter((d) => d.kind === "ok"),
    optional: press2023.filter((d) => d.kind === "mirror"),
  }),
  await request("Download the latest earnings report", "/investors", { download: [findDoc(2025, 4, "earnings")] }),
];
await writeFile(path.join(root, "expected.json"), JSON.stringify(expected, null, 2) + "\n");

console.log(`Generated ${DOCS.filter((d) => d.kind === "ok" || d.kind === "mirror").length} files, ${expected.length} expected requests.`);
