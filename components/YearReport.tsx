import { QUARTERS, QUARTER_NAMES, docsFor } from "@/data/reports";

export default function YearReport({ year }: { year: number }) {
  return (
    <>
      <h1>{year} Quarterly Reports</h1>
      <p className="muted">
        Documents for each quarter of fiscal year {year} (fiscal year equals the calendar year).
      </p>
      {QUARTERS.map((q) => (
        <section key={q} id={`q${q}`} className="quarter">
          <h2>
            {QUARTER_NAMES[q]} Quarter {year}
          </h2>
          <ul className="doc-list">
            {docsFor(year, q).map((doc) => (
              <li key={doc.id}>
                {/* Plain <a>: these are file downloads, not client-side routes. */}
                <a href={encodeURI(doc.href)}>{doc.linkText}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
