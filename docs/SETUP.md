# Setup

## Prerequisites

Use Node.js 22.12+ (Node 22 LTS recommended), npm, Expo Go, a Clerk application, a Supabase project and optionally a Spoonacular key. Frontend currently uses Expo SDK 58. Install/update Expo Go to a compatible client version before scanning on a physical device.

## 1. Install

```sh
cd backend
npm ci
cd ../frontend
npm ci
```

## 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` and replace placeholders.

- Supabase Connect panel: copy a transaction-pooler URL into `DATABASE_URL` and a direct or session-pooler URL into `DIRECT_URL`. Session pooling on port 5432 can be used when direct IPv6 is inaccessible. URL-encode special characters in the database password. Preserve provider-required SSL settings.
- Prisma 7 uses `prisma.config.ts` for CLI connections and the Postgres driver adapter for runtime connections. No Supabase JS client or Supabase Auth is needed.
- Copy `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the same Clerk application used by the frontend.
- Optional `SPOONACULAR_API_KEY` enables recipe discovery. `SPOONACULAR_DAILY_REQUEST_LIMIT` defaults to 45 and cannot be configured above 49, preserving headroom below a 50-call daily test quota. Cached search hits do not consume the upstream request budget. Menu and ordering do not depend on Spoonacular.
- `CORS_ORIGINS` is comma-separated browser origins. Native Expo requests do not depend on browser CORS. Keep it restricted for deployed web clients.

Never put database credentials, Clerk secret keys, or Spoonacular keys in `EXPO_PUBLIC_*` variables.

## 3. Clerk

Enable the Native API in the Clerk dashboard. Assign staff access by setting a user’s Clerk `publicMetadata.role` to `staff`; set `admin` for full administration. Missing or unrecognized roles are treated as `user`. Set roles only from the trusted Clerk dashboard or backend; never accept a role supplied by the mobile client. Staff can manage stock and order stages. Admins can also create menu items and view analytics. Enable email/password sign-in and sign-up with email-code verification. For this starter, do not require username, phone, additional sign-up fields, MFA, or session tasks. The custom React Native authentication form works in Expo Go; it does not use Clerk's native UI components. Password reset and additional verification flows need to be added before a broader launch.

## 4. Database

Use a dedicated development Supabase project. The initial migration has been applied to the configured project. For a fresh project, review the SQL before applying it. The migration enables RLS on application tables without public policies; the server database role must own these tables or have BYPASSRLS. Never expose its connection string to the app.

```sh
cd backend
npm run db:generate
npm run db:deploy
npm run db:seed
```

For future schema changes use `npm run db:migrate -- --name descriptive_name` against development only. `db:deploy` applies checked-in migrations. Seed upserts six sample dishes and does not overwrite existing dishes. The configured project has already been migrated and seeded; rerun the seed only if you want to ensure the sample dishes exist.

## 5. Frontend

Copy `frontend/.env.example` to `frontend/.env`.

```dotenv
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:4000/api
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

Use the same Wi-Fi on your phone and computer. Allow local port 4000 through your firewall. iOS simulator may use localhost; Android emulator normally uses 10.0.2.2. A tunnel for Expo's bundler does not automatically tunnel your API. Use HTTPS for a remote API.

## 6. Start and verify

From the root, run `npm run dev:backend` and `npm run dev:frontend` in separate terminals. Scan the QR code with Expo Go. Restart Expo after changing frontend environment variables.

1. Open `/health` on the backend and verify `{ "status": "ok" }`.
2. Browse seeded dishes, search and filter categories, open dish details.
3. Add dishes and change quantities.
4. Create an account and verify its email; sign in.
5. Enter an Indian address and submit a cash-on-delivery order.
6. Check Orders, refresh, sign out, then sign in as another account and confirm history isolation.
7. Search Spoonacular recipes if configured. Missing keys or quota failures show a recoverable error.

## Troubleshooting

- Cannot connect: check LAN IP, Wi-Fi, firewall, backend process and port.
- Clerk fails: check matching keys, Native API, enabled email/password settings and email verification.
- Prisma fails: check password encoding, pooler region, direct/session URL and database role permissions.
- Recipe discovery unavailable: check key and Spoonacular quota. No mock recipe results are substituted.
- SDK mismatch: run `npx expo install --check` and install a matching Expo Go client.

## References

- [Expo project and Expo Go guidance](https://docs.expo.dev/get-started/create-a-project/)
- [Clerk Expo custom authentication](https://clerk.com/docs/expo/getting-started/quickstart)
- [Clerk Express authentication](https://clerk.com/docs/reference/express/overview)
- [Prisma with Supabase](https://www.prisma.io/docs/orm/overview/databases/supabase)
- [Spoonacular API](https://spoonacular.com/food-api/docs)
