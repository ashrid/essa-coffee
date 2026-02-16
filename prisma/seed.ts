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
  const houseplants = await prisma.category.create({
    data: {
      name: "Houseplants",
      slug: "houseplants",
      description: "Beautiful indoor plants to brighten your home",
    },
  });

  const seeds = await prisma.category.create({
    data: {
      name: "Seeds",
      slug: "seeds",
      description: "Quality seeds for your garden and kitchen",
    },
  });

  const succulents = await prisma.category.create({
    data: {
      name: "Succulents",
      slug: "succulents",
      description: "Low-maintenance succulents and cacti",
    },
  });

  // Create products — 2 per category
  await prisma.product.createMany({
    data: [
      // Houseplants
      {
        name: "Pothos Golden",
        slug: "pothos-golden",
        description:
          "A trailing vine with heart-shaped, golden-yellow variegated leaves. Excellent for beginners and low-light spaces.",
        careInstructions:
          "Water every 1-2 weeks. Tolerates low light but thrives in indirect bright light. Let soil dry out between waterings.",
        price: 12.99,
        images: ["/images/placeholder.jpg"],
        stockQuantity: 15,
        lowStockThreshold: 3,
        isFeatured: true,
        categoryId: houseplants.id,
      },
      {
        name: "Peace Lily",
        slug: "peace-lily",
        description:
          "Elegant white blooms and glossy dark leaves. One of the best air-purifying plants for indoor spaces.",
        careInstructions:
          "Keep soil moist. Tolerates low light. Mist leaves occasionally. Repot every 1-2 years.",
        price: 18.99,
        images: ["/images/placeholder.jpg"],
        stockQuantity: 8,
        lowStockThreshold: 3,
        isFeatured: false,
        categoryId: houseplants.id,
      },
      // Seeds
      {
        name: "Basil Italian Large Leaf",
        slug: "basil-italian-large-leaf",
        description:
          "Classic Italian basil with large, fragrant leaves. Perfect for cooking, pestos, and fresh salads.",
        careInstructions:
          "Start indoors 6 weeks before last frost. Needs full sun and well-drained soil. Pinch flowers to encourage leaf growth.",
        price: 4.99,
        images: ["/images/placeholder.jpg"],
        stockQuantity: 20,
        lowStockThreshold: 5,
        isFeatured: true,
        categoryId: seeds.id,
      },
      {
        name: "Cherry Tomato Mix",
        slug: "cherry-tomato-mix",
        description:
          "A colorful mix of red, yellow, and orange cherry tomatoes. High yield, sweet flavor, great for containers.",
        careInstructions:
          "Start indoors 6-8 weeks before last frost. Full sun, stake or cage when mature. Water consistently.",
        price: 6.99,
        images: ["/images/placeholder.jpg"],
        stockQuantity: 18,
        lowStockThreshold: 5,
        isFeatured: false,
        categoryId: seeds.id,
      },
      // Succulents
      {
        name: "Echeveria Assorted",
        slug: "echeveria-assorted",
        description:
          "Rosette-shaped succulents in a variety of colors. Perfect for windowsills, terrariums, and desk plants.",
        careInstructions:
          "Water deeply but infrequently. Bright indirect light. Well-draining succulent soil. Avoid overwatering.",
        price: 9.99,
        images: ["/images/placeholder.jpg"],
        stockQuantity: 12,
        lowStockThreshold: 3,
        isFeatured: true,
        categoryId: succulents.id,
      },
      {
        name: "Aloe Vera",
        slug: "aloe-vera",
        description:
          "A classic succulent with thick, fleshy leaves containing soothing gel. Practical and beautiful.",
        careInstructions:
          "Water every 2-3 weeks. Bright indirect light. Well-draining soil. Tolerates neglect well.",
        price: 14.99,
        images: ["/images/placeholder.jpg"],
        stockQuantity: 0,
        lowStockThreshold: 3,
        isFeatured: false,
        categoryId: succulents.id,
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
