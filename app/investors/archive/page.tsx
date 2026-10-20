import Link from "next/link";
import { ARCHIVE_YEARS } from "@/data/reports";

export default function Archive() {
  return (
    <>
      <h1>Archive</h1>
      <p>Filings older than three years are kept here.</p>
      <ul className="year-list">
        {ARCHIVE_YEARS.map((y) => (
          <li key={y}>
            <Link href={`/investors/archive/${y}`}>{y}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
