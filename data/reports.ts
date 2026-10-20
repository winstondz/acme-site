// Single source of truth for every document on the site.
// Pages render from it, scripts/generate-files.mjs creates the dummy files from it,
// and expected.json (the agent test oracle) is derived from it.
// Keep this file free of imports and non-erasable TS syntax so Node can run it directly.

export type DocType = "earnings" | "financials" | "stock" | "presentation" | "press";
export type DocKind = "ok" | "broken" | "external" | "mirror";

export interface Doc {
  id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  type: DocType;
  linkText: string;
  filename: string;
  /** Path (or absolute URL for external docs) used in the page's <a href>. */
  href: string;
  kind: DocKind;
  /** For kind "mirror": id of the doc with identical bytes. */
  mirrorOf?: string;
}

export const YEARS = [2023, 2024, 2025] as const;
export const ARCHIVE_YEARS = [2022] as const;
export const QUARTERS = [1, 2, 3, 4] as const;
export const TYPES: DocType[] = ["earnings", "financials", "stock", "presentation", "press"];

export const QUARTER_NAMES: Record<number, string> = {
  1: "First",
  2: "Second",
  3: "Third",
  4: "Fourth",
};

export const TYPE_LABELS: Record<DocType, string> = {
  earnings: "Earnings report",
  financials: "Financial statements",
  stock: "Stock price data",
  presentation: "Investor presentation",
  press: "Press release",
};

export const EXTENSIONS: Record<DocType, string> = {
  earnings: "pdf",
  financials: "xlsx",
  stock: "csv",
  presentation: "pptx",
  press: "pdf",
};

// Deliberately inconsistent naming per year so a link can't be matched by regex alone.
type Namer = (q: number, y: number) => { filename: string; linkText: string };

const NAMERS: Record<number, Record<DocType, Namer>> = {
  2025: {
    earnings: (q, y) => ({ filename: `Q${q}-${y}-earnings.pdf`, linkText: `Q${q} ${y} Earnings Report` }),
    financials: (q, y) => ({ filename: `acme_${y}_q${q}_financials.xlsx`, linkText: "Financial Statements (Excel)" }),
    stock: (q, y) => ({ filename: `acme-stock-q${q}-${y}.csv`, linkText: "Stock price history (CSV)" }),
    presentation: (q) => ({ filename: `fy25-q${q}-deck.pptx`, linkText: "Investor Presentation" }),
    press: (q, y) => ({ filename: `press-release-${y}-q${q}.pdf`, linkText: "Press Release" }),
  },
  2024: {
    earnings: (q, y) => ({
      filename: `acme_${y}_q${q}_earnings_release.pdf`,
      linkText: `${QUARTER_NAMES[q]} Quarter Earnings`,
    }),
    financials: (q, y) => ({ filename: `FS_${y}Q${q}.xlsx`, linkText: `Q${q} Financial Statements` }),
    stock: (q, y) => ({ filename: `ACME_prices_${y}_Q${q}.csv`, linkText: "Share price data" }),
    presentation: (q) => ({ filename: `fy24-q${q}-deck.pptx`, linkText: "Investor Deck" }),
    press: (q) => ({ filename: `PR_${q}Q24.pdf`, linkText: "News release" }),
  },
  2023: {
    earnings: (q, y) => ({
      filename: `${QUARTER_NAMES[q]} Quarter ${y} Results.pdf`,
      linkText: `Quarterly Results - ${QUARTER_NAMES[q]} Quarter`,
    }),
    financials: (q, y) => ({ filename: `acme-financial-statements-q${q}-${y}.xlsx`, linkText: "Financials workbook" }),
    stock: (q, y) => ({ filename: `stockdata_${y}_${q}.csv`, linkText: "Historical stock data" }),
    presentation: (q, y) => ({ filename: `Investor Presentation Q${q} ${y}.pptx`, linkText: "Presentation slides" }),
    press: (q, y) => ({ filename: `acme-pr-${y}-q${q}.pdf`, linkText: "Press release (PDF)" }),
  },
  2022: {
    earnings: (q) => ({ filename: `ACME_${q}Q22_ER.pdf`, linkText: `${q}Q22 earnings release` }),
    financials: (q) => ({ filename: `ACME_${q}Q22_FS.xlsx`, linkText: "Financial statements" }),
    stock: (q) => ({ filename: `ACME_${q}Q22_px.csv`, linkText: "Stock data" }),
    presentation: (q) => ({ filename: `ACME_${q}Q22_IR.pptx`, linkText: "Investor presentation" }),
    press: (q) => ({ filename: `ACME_${q}Q22_PR.pdf`, linkText: "Press announcement" }),
  },
};

// Traps: [year, quarter, type] -> behaviour.
const BROKEN: Array<[number, number, DocType]> = [[2024, 2, "stock"]]; // link 404s
const EXTERNAL: Array<[number, number, DocType]> = [[2025, 1, "presentation"]]; // off-domain host
const EXTERNAL_HOST = "https://example.com/acme-investors";

function matches(list: Array<[number, number, DocType]>, y: number, q: number, t: DocType) {
  return list.some(([ly, lq, lt]) => ly === y && lq === q && lt === t);
}

function build(): Doc[] {
  const docs: Doc[] = [];
  for (const year of [...YEARS, ...ARCHIVE_YEARS]) {
    for (const quarter of QUARTERS) {
      for (const type of TYPES) {
        const { filename, linkText } = NAMERS[year][type](quarter, year);
        const kind: DocKind = matches(BROKEN, year, quarter, type)
          ? "broken"
          : matches(EXTERNAL, year, quarter, type)
            ? "external"
            : "ok";
        docs.push({
          id: `${year}-q${quarter}-${type}`,
          year,
          quarter,
          type,
          linkText,
          filename,
          href: kind === "external" ? `${EXTERNAL_HOST}/${filename}` : `/files/${year}/${filename}`,
          kind,
        });
      }
    }
  }
  // Duplicate trap: same bytes under a different name, listed right after the original.
  const original = docs.find((d) => d.id === "2023-q2-press")!;
  const mirror: Doc = {
    ...original,
    id: "2023-q2-press-mirror",
    filename: "acme-pr-2023-q2-mirror.pdf",
    linkText: "Press release (mirror copy)",
    href: "/files/2023/acme-pr-2023-q2-mirror.pdf",
    kind: "mirror",
    mirrorOf: original.id,
  };
  docs.splice(docs.indexOf(original) + 1, 0, mirror);
  return docs;
}

export const DOCS: Doc[] = build();

export function docsFor(year: number, quarter: number): Doc[] {
  return DOCS.filter((d) => d.year === year && d.quarter === quarter);
}

export function findDoc(year: number, quarter: number, type: DocType): Doc {
  const doc = DOCS.find((d) => d.year === year && d.quarter === quarter && d.type === type);
  if (!doc) throw new Error(`No doc for ${year} Q${quarter} ${type}`);
  return doc;
}

/** The "latest results" banner on /investors links here, a deliberate second link to the same file. */
export const LATEST_DOC_ID = "2025-q4-earnings";
