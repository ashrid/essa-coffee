import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Essa Cafe coffee menu...");

  // Clear existing data (products reference categories, so delete in FK order)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // Create categories
  const hotDrinks = await prisma.category.create({
    data: {
      name: "Hot Drinks",
      slug: "hot-drinks",
      description: "Espresso-based and filter coffee drinks served hot.",
    },
  });

  const icedDrinks = await prisma.category.create({
    data: {
      name: "Iced Drinks",
      slug: "iced-drinks",
      description: "Cold brew, iced lattes, and chilled specialty drinks.",
    },
  });

  const specialty = await prisma.category.create({
    data: {
      name: "Specialty",
      slug: "specialty",
      description: "House signatures and creative seasonal drinks.",
    },
  });

  const food = await prisma.category.create({
    data: {
      name: "Food",
      slug: "food",
      description: "Freshly baked pastries and light bites.",
    },
  });

  // Hot Drinks — 4 products
  await prisma.product.create({
    data: {
      name: "Espresso",
      slug: "espresso",
      description: "A short, intense shot of pure coffee — rich crema, bold finish.",
      price: 3.50,
      images: [],
      isAvailable: true,
      isFeatured: true,
      categoryId: hotDrinks.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Flat White",
      slug: "flat-white",
      description: "Double ristretto with velvety microfoam steamed milk — smooth and balanced.",
      price: 4.50,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: hotDrinks.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Cappuccino",
      slug: "cappuccino",
      description: "Equal parts espresso, steamed milk, and thick dry foam — the classic.",
      price: 4.50,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: hotDrinks.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Filter Coffee",
      slug: "filter-coffee",
      description: "Slow-brewed single origin drip — clean, bright, and endlessly drinkable.",
      price: 3.00,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: hotDrinks.id,
    },
  });

  // Iced Drinks — 4 products
  await prisma.product.create({
    data: {
      name: "Iced Latte",
      slug: "iced-latte",
      description: "Double espresso over ice with cold whole milk — refreshing and mellow.",
      price: 5.00,
      images: [],
      isAvailable: true,
      isFeatured: true,
      categoryId: icedDrinks.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Cold Brew",
      slug: "cold-brew",
      description: "12-hour cold-steeped concentrate — low acidity, naturally sweet, served over ice.",
      price: 5.50,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: icedDrinks.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Iced Matcha Latte",
      slug: "iced-matcha-latte",
      description: "Ceremonial-grade matcha whisked with oat milk over ice — earthy and vibrant.",
      price: 5.50,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: icedDrinks.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Sparkling Coffee Tonic",
      slug: "sparkling-coffee-tonic",
      description: "Single shot espresso over sparkling tonic water with a squeeze of lime — bitter, bright, and unexpected.",
      price: 5.00,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: icedDrinks.id,
    },
  });

  // Specialty — 3 products
  await prisma.product.create({
    data: {
      name: "Honey Oat Latte",
      slug: "honey-oat-latte",
      description: "Espresso with creamy oat milk and a drizzle of local raw honey — house favourite.",
      price: 5.50,
      images: [],
      isAvailable: true,
      isFeatured: true,
      categoryId: specialty.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Cardamom Rose Latte",
      slug: "cardamom-rose-latte",
      description: "Espresso with steamed milk, ground cardamom, and a hint of rose water — fragrant and warming.",
      price: 5.50,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: specialty.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Mushroom Coffee",
      slug: "mushroom-coffee",
      description: "Adaptogenic blend with lion's mane and chaga — smooth coffee taste, functional focus.",
      price: 6.00,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: specialty.id,
    },
  });

  // Food — 3 products
  await prisma.product.create({
    data: {
      name: "Almond Croissant",
      slug: "almond-croissant",
      description: "Twice-baked flaky croissant filled with almond cream and topped with toasted flaked almonds.",
      price: 4.50,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: food.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Banana Bread",
      slug: "banana-bread",
      description: "House-baked with walnuts and brown butter — dense, moist, and exactly right with a flat white.",
      price: 3.50,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: food.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Smashed Avo Toast",
      slug: "smashed-avo-toast",
      description: "Sourdough toast with smashed avocado, dried chilli flakes, and microgreens.",
      price: 8.00,
      images: [],
      isAvailable: true,
      isFeatured: false,
      categoryId: food.id,
    },
  });

  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log(`Seed complete. Created ${categoryCount} categories and ${productCount} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
