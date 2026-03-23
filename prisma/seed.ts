import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const espresso = await prisma.category.create({
    data: {
      name: "Espresso Drinks",
      slug: "espresso-drinks",
      description: "Classic and specialty espresso-based beverages",
    },
  });

  const filter = await prisma.category.create({
    data: {
      name: "Filter Coffee",
      slug: "filter-coffee",
      description: "Drip, batch brew, and pour-over coffees",
    },
  });

  const food = await prisma.category.create({
    data: {
      name: "Food",
      slug: "food",
      description: "Pastries, snacks, and light bites",
    },
  });

  // Create products — 2 per category
  await prisma.product.createMany({
    data: [
      // Espresso
      {
        name: "Flat White",
        slug: "flat-white",
        description: "A double ristretto topped with silky steamed milk.",
        price: 4.5,
        images: [],
        isAvailable: true,
        isFeatured: true,
        categoryId: espresso.id,
      },
      {
        name: "Cappuccino",
        slug: "cappuccino",
        description: "Equal parts espresso, steamed milk, and foam.",
        price: 4.0,
        images: [],
        isAvailable: true,
        isFeatured: false,
        categoryId: espresso.id,
      },
      // Filter
      {
        name: "Batch Brew",
        slug: "batch-brew",
        description: "Single-origin filter coffee brewed fresh every hour.",
        price: 3.0,
        images: [],
        isAvailable: true,
        isFeatured: true,
        categoryId: filter.id,
      },
      {
        name: "Cold Brew",
        slug: "cold-brew",
        description: "12-hour cold-steeped concentrate served over ice.",
        price: 4.5,
        images: [],
        isAvailable: true,
        isFeatured: false,
        categoryId: filter.id,
      },
      // Food
      {
        name: "Almond Croissant",
        slug: "almond-croissant",
        description: "Buttery croissant filled with almond cream, topped with flaked almonds.",
        price: 3.5,
        images: [],
        isAvailable: true,
        isFeatured: true,
        categoryId: food.id,
      },
      {
        name: "Banana Bread",
        slug: "banana-bread",
        description: "House-made banana bread with a dark chocolate swirl.",
        price: 3.0,
        images: [],
        isAvailable: false,
        isFeatured: false,
        categoryId: food.id,
      },
    ],
  });

  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log(`Seeded ${categoryCount} categories and ${productCount} products.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
