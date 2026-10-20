import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1>Acme Corp</h1>
      <p>
        Acme Corp makes anvils, rocket skates and other industrial supplies. We have been a publicly
        traded company since 1998.
      </p>
      <p>
        Shareholders and analysts can find quarterly reports, financial statements, stock data and
        presentations on our <Link href="/investors">Investors page</Link>.
      </p>
    </>
  );
}
