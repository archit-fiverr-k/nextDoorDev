const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const defaultCategoriesData = [
  {
    name: "Vaccinations",
    slug: "vaccinations",
    type: "SERVICE",
    description:
      "Seasonal flu jabs, travel immunisations, and boosters delivered by clinical prescribers.",
    imageUrl: "/assets/vaccination_care.png",
    color: "#10B981",
    displayOrder: 1,
  },
  {
    name: "Travel Health",
    slug: "travel-health",
    type: "SERVICE",
    description: "Yellow Fever, Typhoid, Hepatitis, and Malaria prophylaxis consultation.",
    imageUrl: "/assets/pharmacy_consultation.png",
    color: "#0F172A",
    displayOrder: 2,
  },
  {
    name: "Ear Wax Removal",
    slug: "ear-wax-removal",
    type: "SERVICE",
    description: "Safe microsuction cleaning and audiology ear examinations.",
    imageUrl: "/assets/pharmacy_consultation.png",
    color: "#3B82F6",
    displayOrder: 3,
  },
  {
    name: "Blood Diagnostics",
    slug: "blood-diagnostics",
    type: "SERVICE",
    description: "Full biomarker screenings, cholesterol tests, and health checks.",
    imageUrl: "/assets/vaccination_care.png",
    color: "#8B5CF6",
    displayOrder: 4,
  },
  {
    name: "Women's Health",
    slug: "womens-health",
    type: "SERVICE",
    description: "Contraception, cystitis treatments, and period delay consultations.",
    imageUrl: "/assets/patient_portrait.png",
    color: "#EC4899",
    displayOrder: 5,
  },
  {
    name: "General Consultations",
    slug: "general-consultations",
    type: "SERVICE",
    description: "Face-to-face consultation for minor ailments and prescription advice.",
    imageUrl: "/assets/pharmacy_consultation.png",
    color: "#10B981",
    displayOrder: 6,
  },
];

async function main() {
  console.log("🔄 Updating category images in database...");

  // 1. Fetch all existing categories
  const existingCategories = await db.category.findMany();
  console.log(`Found ${existingCategories.length} existing categories in DB.`);

  for (const catData of defaultCategoriesData) {
    const existing = existingCategories.find(
      (c) => c.slug === catData.slug || c.name.toLowerCase() === catData.name.toLowerCase()
    );

    if (existing) {
      await db.category.update({
        where: { id: existing.id },
        data: {
          imageUrl: catData.imageUrl,
          description: existing.description || catData.description,
          color: existing.color || catData.color,
          status: "ACTIVE",
          deleted: false,
        },
      });
      console.log(`✅ Updated image for existing category: ${existing.name}`);
    } else {
      await db.category.create({
        data: {
          name: catData.name,
          slug: catData.slug,
          type: catData.type,
          description: catData.description,
          imageUrl: catData.imageUrl,
          color: catData.color,
          displayOrder: catData.displayOrder,
          status: "ACTIVE",
          deleted: false,
        },
      });
      console.log(`✨ Created new category with image: ${catData.name}`);
    }
  }

  // 2. Also ensure any other categories in DB have a fallback imageUrl if null
  const nullImageCategories = await db.category.findMany({
    where: { imageUrl: null },
  });

  for (const c of nullImageCategories) {
    await db.category.update({
      where: { id: c.id },
      data: { imageUrl: "/assets/pharmacy_consultation.png" },
    });
    console.log(`🖼️ Assigned fallback image to category: ${c.name}`);
  }

  console.log("🎉 Category database images update completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Category images update error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
