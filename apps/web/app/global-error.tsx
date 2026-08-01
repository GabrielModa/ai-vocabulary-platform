"use client";

export default function GlobalError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <section className="status-card" aria-labelledby="global-error-title">
            <h1 id="global-error-title">The application could not start</h1>
            <button className="action" type="button" onClick={reset}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
