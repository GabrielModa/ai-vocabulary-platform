export default function NotFound() {
  return (
    <main className="shell">
      <section className="status-card" aria-labelledby="not-found-title">
        <p className="eyebrow">Unavailable</p>
        <h1 id="not-found-title">Request unavailable</h1>
        <p className="summary">The request cannot be completed.</p>
      </section>
    </main>
  );
}
