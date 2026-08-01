import { DenyByDefaultOperatorAuthorization } from "../../src/authorization/deny-by-default-authorization";

export function AccessDenied() {
  return (
    <main className="shell">
      <section className="status-card" aria-labelledby="access-title" role="alert">
        <p className="eyebrow">Restricted area</p>
        <h1 id="access-title">Access denied</h1>
        <p className="summary">Your request cannot be completed.</p>
      </section>
    </main>
  );
}

export default async function ProtectedPage() {
  const authorization = new DenyByDefaultOperatorAuthorization();
  const decision = await authorization.authorize({ capability: "operator.shell" });

  if (!decision.allowed) return <AccessDenied />;

  return null;
}
