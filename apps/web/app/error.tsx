"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    // A provider adapter will capture the digest after the observability task.
    void error.digest;
  }, [error]);

  return (
    <main className="shell">
      <section className="status-card" aria-labelledby="error-title">
        <p className="eyebrow">Temporary problem</p>
        <h1 id="error-title">Something did not load</h1>
        <p className="summary">Your saved learning progress is not affected.</p>
        <button className="action" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
