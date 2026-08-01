"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    void error.digest;
  }, [error]);

  return (
    <main className="shell">
      <section className="status-card" aria-labelledby="error-title" role="alert">
        <p className="eyebrow">Temporary problem</p>
        <h1 id="error-title">The request could not be completed</h1>
        <p className="summary">No operational details have been disclosed.</p>
        <button className="action" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
