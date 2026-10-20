import { notFound } from "next/navigation";
import YearReport from "@/components/YearReport";
import { ARCHIVE_YEARS } from "@/data/reports";

export function generateStaticParams() {
  return ARCHIVE_YEARS.map((y) => ({ year: String(y) }));
}

export default async function ArchiveYear({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const y = Number(year);
  if (!(ARCHIVE_YEARS as readonly number[]).includes(y)) notFound();
  return <YearReport year={y} />;
}
