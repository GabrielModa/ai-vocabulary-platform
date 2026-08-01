"use client";

export default function GlobalError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <section className="status-card" aria-labelledby="global-error-title" role="alert">
            <h1 id="global-error-title">Operator access is unavailable</h1>
            <button className="action" type="button" onClick={reset}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
