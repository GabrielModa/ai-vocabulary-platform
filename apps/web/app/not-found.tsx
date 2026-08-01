import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <section className="status-card" aria-labelledby="not-found-title">
        <p className="eyebrow">404</p>
        <h1 id="not-found-title">Page not found</h1>
        <p className="summary">The requested page does not exist.</p>
        <Link className="action" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
