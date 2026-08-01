# Enforced architecture boundaries

Run `pnpm boundaries` to validate dependency direction. The command is also part of `pnpm lint` and
CI.

## Enforced rules

- Domain may import domain code only and cannot import framework/provider packages.
- Application may import domain and application code.
- Adapters may import domain, application, and adapters.
- Delivery may import domain, application, and delivery; bootstrap performs adapter composition.
- A bounded context may import another context only through its `contracts/` or `public/` directory.
- Published workspace packages follow the allowlist in `config/architecture-boundaries.json`.

Violations report the source file and rule. New providers or packages require an architecture review
and an explicit configuration update. Do not bypass the checker with dynamic or aliased imports;
aliases must resolve to the same architectural ownership.
