# API

Base URL: `http://localhost:4000/api`. JSON responses. Protected routes require `Authorization: Bearer <Clerk session token>`.

| Method | Path                       | Authentication | Description                                |
| ------ | -------------------------- | -------------- | ------------------------------------------ |
| GET    | `/health` (outside `/api`) | Public         | Process liveness, not database readiness   |
| GET    | `/foods?query=&category=`  | Public         | Available foods, up to 100                 |
| GET    | `/recipes?query=&offset=0` | Public         | 12 Spoonacular recipes; offset up to 900   |
| GET    | `/orders`                  | Required       | Latest 50 orders belonging to caller       |
| POST   | `/orders`                  | Required       | Validate and create cash-on-delivery order |

Example order request:

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

Prices are integer paise. Never submit client-calculated totals as authoritative values. Order creation returns 201, replay returns 200. Missing authentication returns 401; invalid input 400; unavailable foods 409; unconfigured or exhausted recipe service 503; upstream recipe errors 502. Error objects have `message`; validation errors also have `issues`. Rate limits may return 429. Do not blindly generate a new idempotency key after a timeout; retry the same payload/key.
