# Authentication and authorization boundaries

`@vocabulary/auth` separates provider-backed authentication from application authorization. It does
not implement signup, login UI, social providers, or product permissions.

## Flow

1. `BetterAuthIdentityAdapter` treats the provider response as untrusted and maps it to the small
   `SessionIdentity` contract.
2. A use case builds an explicit `AuthorizationContext` with identity, action, resource ownership,
   requirements, and current grants.
3. A selected policy returns an internal allow/deny reason. If no policy is selected,
   `DenyByDefaultPolicy` denies.
4. Delivery maps every denial to the same safe response when resource existence is sensitive.

The adapter depends on a structural `BetterAuthSessionApi`, so domain/application tests use fakes
without importing or initializing Better Auth.

## Authorization matrix format

Every future capability documents and tests one row:

| Audience         | Action             | Resource owner | Required consent | Required role   | Required entitlement | Failure response              |
| ---------------- | ------------------ | -------------- | ---------------- | --------------- | -------------------- | ----------------------------- |
| learner/operator | stable action name | self/any/none  | explicit values  | explicit values | explicit values      | generic 404 or documented 403 |

Blank cells are not implicit permission: use an explicit empty list. Administrative policies use the
separate `operator` audience and cannot reuse learner assumptions.
