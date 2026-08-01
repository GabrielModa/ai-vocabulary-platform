# Security Policy

## Supported versions

The project has not released a production version. Security fixes currently target the default
branch.

## Reporting a vulnerability

Do not disclose vulnerabilities in public issues, discussions, or pull requests. Use GitHub's
private vulnerability reporting feature for this repository. Include affected components, impact,
reproduction conditions, and any known mitigation without including real user data or credentials.

Maintainers should acknowledge a report within five business days, establish severity and next
steps, and coordinate disclosure after a fix is available.

## Repository security rules

- Never commit secrets, production data, access tokens, voice recordings, or personal data.
- Use least-privilege credentials and rotate exposed credentials immediately.
- Treat AI output, uploaded content, and webhook input as untrusted.
- Add authorization, rate-limit, validation, and audit tests to sensitive changes.
