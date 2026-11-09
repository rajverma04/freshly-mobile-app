# Validation

Checked on 10 November 2026.

- Final Expo Router iOS and Android production bundles: passed.
- Prisma 7 client generation: passed.
- Backend TypeScript compilation: passed.
- Frontend TypeScript and Expo ESLint: passed.
- Backend tests: 3 passed, covering order amount/quantity/address validation, unauthenticated GET/POST order rejection, health, unknown routes, and missing/invalid recipe configuration.
- Expo SDK-compatible dependency alignment was performed using Expo CLI.

The HTTP tests use synthetic environment values and never contact external services. They do not verify real Clerk token acceptance, database transactions, migrations, user-to-user isolation with real accounts, or Spoonacular responses.

Live service and device validation requires your credentials: follow the checklist in SETUP.md. No database migration has been applied to a remote Supabase project. No physical-device or simulator UI review has been performed.

## Dependency audit

Backend audit: 0 known vulnerabilities at installation.

Frontend audit after Router/lint installation: 15 findings (12 moderate, 3 high), including development tools. Runtime-only audit: 8 findings (5 moderate, 3 high). The high findings trace to Expo Router SDK 57's `query-string` / `decode-uri-component` dependency. Moderate findings include Expo fingerprint/glob/minimatch tooling. npm proposes SDK-changing fixes; these were not force-applied because Expo Go native compatibility must be preserved. The patched decoder is ESM while the currently required decoder is CommonJS, so an untested transitive override was not applied. Recheck upstream SDK 57 patches or upgrade the entire Expo SDK/client together before a public release.
