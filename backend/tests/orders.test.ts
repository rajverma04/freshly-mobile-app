import { test } from "node:test";
import assert from "node:assert/strict";
import {
  totals,
  orderSchema,
  VALID_TRANSITIONS,
  NEXT_STATUS_MAP,
} from "../src/modules/orders/order.schema.js";

test("prices use integer paise and free delivery threshold", () => {
  assert.deepEqual(totals([{ price: 24900, quantity: 2 }]), {
    subtotal: 49800,
    deliveryFee: 3900,
    total: 53700,
  });
  assert.equal(totals([{ price: 25000, quantity: 2 }]).deliveryFee, 0);
});

const valid = {
  idempotencyKey: "00000000-0000-4000-8000-000000000000",
  address: {
    name: "Test User",
    phone: "9876543210",
    line: "12 Example Street",
    city: "Delhi",
    postalCode: "110001",
  },
  items: [{ foodId: "a", quantity: 1 }],
};

test("validates quantities, duplicate IDs and addresses", () => {
  assert.equal(orderSchema.safeParse(valid).success, true);
  for (const quantity of [0, -1, 1.5, 21])
    assert.equal(
      orderSchema.safeParse({ ...valid, items: [{ foodId: "a", quantity }] })
        .success,
      false,
    );
  assert.equal(
    orderSchema.safeParse({ ...valid, items: [...valid.items, ...valid.items] })
      .success,
    false,
  );
  assert.equal(
    orderSchema.safeParse({
      ...valid,
      address: { ...valid.address, postalCode: "bad" },
    }).success,
    false,
  );
});

test("order status lifecycle transitions and next step mapping", () => {
  assert.equal(NEXT_STATUS_MAP.PLACED, "CONFIRMED");
  assert.equal(NEXT_STATUS_MAP.CONFIRMED, "PREPARING");
  assert.equal(NEXT_STATUS_MAP.PREPARING, "OUT_FOR_DELIVERY");
  assert.equal(NEXT_STATUS_MAP.OUT_FOR_DELIVERY, "DELIVERED");
  assert.equal(NEXT_STATUS_MAP.DELIVERED, undefined);
  assert.equal(NEXT_STATUS_MAP.CANCELLED, undefined);

  assert.ok(VALID_TRANSITIONS.PLACED.includes("CONFIRMED"));
  assert.ok(VALID_TRANSITIONS.PLACED.includes("CANCELLED"));
  assert.ok(VALID_TRANSITIONS.CONFIRMED.includes("PREPARING"));
  assert.ok(VALID_TRANSITIONS.CONFIRMED.includes("CANCELLED"));
  assert.ok(VALID_TRANSITIONS.PREPARING.includes("OUT_FOR_DELIVERY"));
  assert.deepEqual(VALID_TRANSITIONS.DELIVERED, []);
  assert.deepEqual(VALID_TRANSITIONS.CANCELLED, []);
});
