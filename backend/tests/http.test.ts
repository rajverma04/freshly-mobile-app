import { test } from "node:test";
import assert from "node:assert/strict";
// Synthetic configuration: these tests never contact Clerk, Postgres or Spoonacular.
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.CLERK_PUBLISHABLE_KEY = `pk_test_${Buffer.from("test.clerk.accounts.dev$").toString("base64")}`;
process.env.CLERK_SECRET_KEY = "sk_test_not_a_real_key";
process.env.SPOONACULAR_API_KEY = "";
const { app } = await import("../src/app.js");
test("HTTP health, authentication boundary and recipe configuration", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });
    for (const method of ["GET", "POST"]) {
      const response = await fetch(`${base}/api/orders`, { method });
      assert.equal(response.status, 401);
      assert.equal((await response.json()).message, "Please sign in.");
    }
    assert.equal((await fetch(`${base}/api/recipes`)).status, 503);
    assert.equal((await fetch(`${base}/api/recipes?offset=-1`)).status, 400);
    assert.equal((await fetch(`${base}/missing`)).status, 404);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
