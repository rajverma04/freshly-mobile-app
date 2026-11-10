# Architecture

The mobile client talks only to Clerk for authentication and the Node API for application data. Clerk issues session tokens stored through Expo SecureStore; the API verifies tokens with Clerk middleware. Orders always derive the owner from verified authentication, never the request body. Backend authorization reads `publicMetadata.role` from Clerk: missing/unknown values default to `user`, `staff` can manage kitchen orders and stock, and `admin` can additionally create menu entries and view analytics. Customer routes cannot advance order status. Menu browsing and recipes remain public; order, account, kitchen and admin endpoints require authentication.

Supabase provides Postgres; Prisma accesses it on the backend. Clerk replaces Supabase Auth. Public Supabase table access is disabled by RLS in the initial migration. The trusted backend role performs queries and explicit order ownership filtering.

## Catalog and recipes

`Food` is the orderable catalog, with server-owned INR pricing and availability. The sample seed is an illustrative single-kitchen menu. Optional `recipeId` can link an independently curated menu item to a Spoonacular recipe. The discovery endpoint proxies search and exposes only selected result fields. Search results are cached in Supabase by normalized query and page offset for 24 hours; repeat searches do not consume Spoonacular quota during that window. A database-backed atomic daily request counter caps new upstream searches at 45 by default (configurable up to 49), leaving safety headroom below the 50-call test quota. The cap is shared across backend instances and resets at UTC midnight. If Spoonacular is unavailable or the quota is exhausted, a previously cached result is served stale. The sellable menu remains a separate curated catalog because Spoonacular recipes do not supply this kitchen's prices or stock. API keys remain server-side. Spoonacular's source URLs are preserved; review your plan's attribution, image and commercial usage terms before publishing. Recipe cost estimates are not restaurant sale prices.

## Checkout

Client sends food IDs, quantities, address and a UUID idempotency key. The API validates shape and quantity bounds, rejects repeated IDs and unavailable food, fetches authoritative prices and saves order plus line-item snapshots in one transaction. Delivery is ₹39 below ₹500 and free at/above ₹500. No taxes or online payment are modeled. Unique `(userId,idempotencyKey)` prevents duplicate retry writes. A repeated key returns the original order. The form preserves the key for retries of the same payload; changed payloads get a new key. Cart persists locally on device. Promotions and simulated online payment remain client-side demos and are not authoritative order pricing or payment. The tracking route reports simulated coordinates and rider details, not real GPS.

## Module boundaries

Backend routes delegate shared validation/pricing to the order schema module and database access to the Prisma library. Frontend modules own their screens and components. Shared UI components, theme, data-fetching hooks and API client contain cross-cutting code. The root Expo Router layout composes providers; the tabs layout handles navigation. Cart is in React context.

## Before production

Add durable cart/checkout recovery, integration tests against isolated Postgres and Clerk test users, a controlled process for assigning/revoking Clerk staff roles, service-area validation, order cancellation/refunds, payment integration if needed, monitoring, deployment secrets, HTTPS, distributed rate limiting and explicit proxy configuration. Local in-memory rate limiting is suitable for a single development process. Add pagination beyond the most recent 50 orders and first 100 menu items when needed.
