import Link from "next/link";
import { ARCHIVE_YEARS, DOCS, LATEST_DOC_ID, YEARS } from "@/data/reports";

export default function Investors() {
  const latest = DOCS.find((d) => d.id === LATEST_DOC_ID)!;
  return (
    <>
      <h1>Investor Relations</h1>
      <p>Quarterly reports and supporting documents, organised by year.</p>

      <div className="banner">
        <strong>Latest results:</strong> <a href={encodeURI(latest.href)}>Q4 2025 earnings report</a>
      </div>

      <h2>Reports by year</h2>
      <ul className="year-list">
        {[...YEARS].reverse().map((y) => (
          <li key={y}>
            <Link href={`/investors/reports/${y}`}>{y}</Link>
          </li>
        ))}
      </ul>

      <p className="muted">
        Looking for older filings? Visit the <Link href="/investors/archive">archive</Link> (
        {ARCHIVE_YEARS.join(", ")}).
      </p>
    </>
  );
}
