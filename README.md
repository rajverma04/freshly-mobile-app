# Freshly — food delivery starter

Expo Go / React Native frontend and a separate Node.js / Express API. TypeScript throughout, Clerk authentication, Supabase Postgres through Prisma, and Spoonacular recipe discovery.

## Structure

```text
frontend/
  src/app/                   Expo Router layouts and thin route wrappers
  src/modules/
    auth/                    Email/password sign-in and verified sign-up
    catalog/                 Menu, cards and dish detail
    recipes/                 Spoonacular discovery
    cart/                    Cart state, rows and screen
    checkout/                Address form and order placement
    orders/                  Private order history
    account/                 Account and sign-out
  src/shared/                API client, hooks, types, UI primitives, theme
backend/
  src/config/                Validated environment
  src/lib/                   Prisma client
  src/middleware/            Authentication and error handling
  src/modules/               Catalog, recipes, orders
  prisma/                    Schema, migrations, sample menu seed
  tests/                     Order validation and pricing tests
 docs/                       Setup, architecture and API reference
```

Start with [setup](docs/SETUP.md). See [architecture](docs/ARCHITECTURE.md), [API](docs/API.md), and [validation](docs/VALIDATION.md).

## Run

After installing dependencies, setting environment variables, and migrating/seeding:

```sh
# Terminal 1, repository root
npm run dev:backend
# Terminal 2, repository root
npm run dev:frontend
```

Scan the Expo QR code on a phone on the same Wi-Fi. The frontend API URL must use the computer's LAN IP, not localhost.

## Included

Searchable and categorized menu, dish details, quantity controls, Clerk email/password authentication, email verification, validated Indian delivery addresses, cash-on-delivery checkout, idempotent order creation, and account-scoped order history. Recipe discovery uses a backend-only Spoonacular key. Prices use integer paise (INR).

## Scope

This is a runnable development MVP, not a deployed delivery business. Sample menu items and images are illustrative. Recipe results are inspiration, not automatically purchasable restaurant inventory. The cart is session-memory only. Payment processing, restaurant/admin tools, stock counts, delivery dispatch, service-area validation, taxes, push notifications, password reset, and MFA flows are not implemented. Orders begin at PLACED; there is no simulated live tracking or status updater. Configure and test real services before production use.
