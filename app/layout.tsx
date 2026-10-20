import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acme Corp",
  description: "Acme Corp: a fictional company used as a test target for a file-downloading agent.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Acme Corp
          </Link>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/investors">Investors</Link>
            <Link href="/investors/archive">Archive</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          Acme Corp is fictional. All figures and documents are dummy data for testing.
        </footer>
      </body>
    </html>
  );
}
