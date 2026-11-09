import "dotenv/config";
import { prisma as db } from "../src/lib/prisma.js";
const foods = [
  [
    "paneer-bowl",
    "Paneer power bowl",
    "Charred paneer, brown rice, crunchy greens and mint dressing.",
    "Bowls",
    24900,
    true,
    "photo-1512621776951-a57141f2eefd",
  ],
  [
    "classic-burger",
    "The classic burger",
    "Grilled chicken, crisp lettuce, tomato and house sauce.",
    "Burgers",
    19900,
    false,
    "photo-1568901346375-23c9450c58cd",
  ],
  [
    "garden-pizza",
    "Garden fresh pizza",
    "Stone-baked crust, mozzarella, peppers and fresh basil.",
    "Pizza",
    34900,
    true,
    "photo-1579751626657-72bc17010498",
  ],
  [
    "pasta",
    "Creamy mushroom pasta",
    "Penne, roasted mushrooms and a rich parmesan sauce.",
    "Pasta",
    27900,
    true,
    "photo-1473093295043-cdd812d0e601",
  ],
  [
    "biryani",
    "Chicken dum biryani",
    "Fragrant basmati rice, slow-cooked chicken and cooling raita.",
    "Bowls",
    29900,
    false,
    "photo-1563379091339-03246963d96c",
  ],
  [
    "salad",
    "Summer crunch salad",
    "Seasonal vegetables, avocado and a bright lemon dressing.",
    "Salads",
    21900,
    true,
    "photo-1512621776951-a57141f2eefd",
  ],
] as const;
try {
  for (const [
    id,
    name,
    description,
    category,
    price,
    vegetarian,
    photo,
  ] of foods)
    await db.food.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name,
        description,
        category,
        price,
        vegetarian,
        image: `https://images.unsplash.com/${photo}?w=800&auto=format&fit=crop`,
      },
    });
} finally {
  await db.$disconnect();
}
