# API

Base URL: `http://localhost:4000/api`. JSON responses. Protected routes require `Authorization: Bearer <Clerk session token>`. Clerk `publicMetadata.role` controls staff access: missing or unrecognized values resolve to `user`; `staff` can manage kitchen orders and stock, and `admin` can also create menu items and view analytics. Never accept roles from client input.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` (outside `/api`) | Public | Process liveness only |
| GET | `/foods?query=&category=` | Public | Available menu, up to 100 items |
| GET | `/recipes?query=&offset=0` | Public | Spoonacular search; Supabase-cached for 24 hours |
| GET | `/orders/me` | Signed in | Current caller's effective role |
| GET | `/orders` | Signed in | Caller’s latest 50 orders |
| POST | `/orders` | Signed in | Create order using server menu prices |
| GET | `/orders/:id` | Owner | Read one own order |
| GET | `/orders/:id/track` | Owner | Simulated tracking data; not GPS |
| POST | `/orders/:id/cancel` | Owner | Cancel own placed/confirmed order |
| GET | `/foods/admin` | Staff/admin | List all menu items |
| PATCH | `/foods/:id/toggle` | Staff/admin | Toggle item availability |
| GET | `/orders/kitchen/live` | Staff/admin | Recent customer orders |
| POST | `/orders/kitchen/:id/advance` | Staff/admin | Advance order status |
| POST | `/orders/kitchen/:id/cancel` | Staff/admin | Cancel a kitchen order |
| POST | `/foods` | Admin | Create a menu item |
| GET | `/orders/admin/analytics` | Admin | Sales and order analytics |

Customer clients cannot advance order status. For development, grant a role by setting a trusted user’s Clerk `publicMetadata.role` to `staff` or `admin` in the Clerk dashboard. Existing accounts with no metadata remain ordinary customers.

Order request example:

```json
{
  "idempotencyKey": "b36c5c64-1139-4866-9f31-648659024f90",
  "address": {
    "name": "Example Customer",
    "phone": "9876543210",
    "line": "12 Example Street, Apartment 4",
    "city": "New Delhi",
    "postalCode": "110001"
  },
  "items": [{ "foodId": "paneer-bowl", "quantity": 2 }]
}
```

Prices are integer paise. Do not submit client totals as authoritative values. Creation returns 201 and an idempotent replay returns 200. Common errors: 401 unauthenticated, 403 insufficient role, 400 invalid request, 404 missing order/item, 409 unavailable menu item, 429 rate limited. Retry a timed-out submission with the same payload and idempotency key.

Promotions and online payment UI are prototypes. The server does not validate discounts or verify payment. Tracking coordinates and rider details are simulated. Do not use these prototype features for real orders.
