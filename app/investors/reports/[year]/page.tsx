import { notFound } from "next/navigation";
import YearReport from "@/components/YearReport";
import { YEARS } from "@/data/reports";

export function generateStaticParams() {
  return YEARS.map((y) => ({ year: String(y) }));
}

export default async function ReportsYear({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const y = Number(year);
  if (!(YEARS as readonly number[]).includes(y)) notFound();
  return <YearReport year={y} />;
}
