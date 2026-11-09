import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
const server = app.listen(env.PORT, "0.0.0.0", () =>
  console.log(`API listening on port ${env.PORT}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    }),
  );
