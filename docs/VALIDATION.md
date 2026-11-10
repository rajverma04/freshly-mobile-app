# Validation

Last checked 10 November 2026.

- Backend TypeScript typecheck and production build: passed after role and recipe-cache changes.
- Frontend TypeScript and Expo lint: passed after removing customer order-advance controls.
- Earlier backend tests passed for totals, order input validation, health, unauthenticated order access, and recipe configuration. The live role guard and owner-only tracking need authenticated integration coverage.
- Earlier Expo iOS and Android bundles succeeded before the latest Antigravity features and RBAC edits; rebundle after changes before device use.
- Supabase URLs connected, Clerk backend secret authenticated, Spoonacular returned a recipe. Initial Supabase migration and sample seed were applied in the prior session.

## Role setup

Clerk users default to the `user` role. Assign trusted staff using Clerk Dashboard → user → public metadata, for example `{"role":"staff"}`. Assign `{"role":"admin"}` for menu creation and analytics. The Node API reads metadata from Clerk on protected requests; role changes take effect on subsequent requests. Do not let users edit their own public metadata through the app.

## Still unverified / prototype limits

No authenticated customer/staff/admin integration tests or device walkthrough have been run for the recent changes. Confirm regular users receive 403 on staff/admin endpoints, staff can run kitchen/stock workflows, and admins can read analytics/create menu items. Tracking is generated from fixed sample coordinates and a simulated timeline; there is no driver GPS integration. Payment UI simulates success; no provider verifies or captures payments. Promo discounts are client-only and are not included in authoritative server totals. Push notifications, payment provider integration, and server-validated promotions remain unfinished.

Check current dependency advisories with `npm audit` in both frontend and backend before release; Expo SDK was upgraded to 58 after the previous audit and its old counts no longer apply.
