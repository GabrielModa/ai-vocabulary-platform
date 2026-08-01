export default function FoundationPage() {
  return (
    <main id="main-content" className="shell">
      <section className="status-card" aria-labelledby="foundation-title">
        <p className="eyebrow">Foundation status</p>
        <h1 id="foundation-title">Your vocabulary. Your world.</h1>
        <p className="summary">
          The learner experience is being prepared for photos, topics, and personal word
          collections.
        </p>
        <div className="status" role="status" aria-label="Application status">
          <span aria-hidden="true" className="status-dot" />
          Web foundation ready
        </div>
      </section>
    </main>
  );
}
