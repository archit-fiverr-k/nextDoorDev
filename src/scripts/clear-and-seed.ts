import { PrismaClient, TenantStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

async function main() {
  console.log("🚀 Starting database reset & seed...");

  // 1. Clean transactional tables
  console.log("🧹 Cleaning transactional & relational tables...");
  await prisma.appointment.deleteMany();
  await prisma.cRMNote.deleteMany();
  await prisma.communicationsLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.bookingOtp.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.patientNotification.deleteMany();
  await prisma.subscriptionHistory.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.searchAnalytics.deleteMany();
  await prisma.searchCallbackRequest.deleteMany();
  await prisma.searchNotificationWaitlist.deleteMany();

  // 2. Clean entity tables (except SuperAdmin)
  console.log(
    "🧹 Cleaning entity tables (Services, Categories, Customers, Pharmacies, PlatformAdmins)..."
  );
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.pharmacy.deleteMany();
  await prisma.platformAdmin.deleteMany();

  console.log("✅ Purged all mock data. SuperAdmin entries have been preserved.");

  // 3. Seed top 5 categories
  console.log("🌱 Seeding top 5 categories...");
  const categoriesData = [
    {
      name: "Travel Health",
      slug: "travel-health",
      type: "SERVICE",
      description: "Vaccinations and clinical health advice for international travelers.",
      displayOrder: 1,
    },
    {
      name: "Vaccinations",
      slug: "vaccinations",
      type: "SERVICE",
      description: "Protect yourself and your family with regular immunizations and booster slots.",
      displayOrder: 2,
    },
    {
      name: "Men's Health",
      slug: "mens-health",
      type: "SERVICE",
      description: "Clinical consultations and treatments for male health conditions.",
      displayOrder: 3,
    },
    {
      name: "Women's Health",
      slug: "womens-health",
      type: "SERVICE",
      description: "Clinical treatments, contraception, and checks for female health.",
      displayOrder: 4,
    },
    {
      name: "Minor Ailments",
      slug: "minor-ailments",
      type: "SERVICE",
      description: "NHS Pharmacy First treatments for minor health conditions.",
      displayOrder: 5,
    },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: cat,
    });
    categoriesMap[cat.slug] = createdCat.id;
  }
  console.log("✅ Seeded top 5 categories.");

  // 4. Seed 5 pharmacies in top 5 cities
  console.log("🌱 Seeding 5 pharmacies across top 5 cities...");
  const defaultPasswordHash = hashPassword("password123");

  const pharmaciesData = [
    {
      name: "West End Pharmacy",
      slug: "west-end-pharmacy",
      displayName: "West End Pharmacy London",
      email: "london@nextdoorclinic.co.uk",
      phone: "020 7437 1234",
      address: "12 Wardour St, Soho, London, W1D 1AN",
      postcode: "W1D 1AN",
      city: "London",
      latitude: 51.5117,
      longitude: -0.1315,
      brandColor: "#10B981",
      status: TenantStatus.APPROVED,
      passwordHash: defaultPasswordHash,
      isFirstLogin: false,
      services: [
        {
          name: "COVID Booster Vaccination",
          description: "Autumn/Winter COVID-19 booster vaccinations.",
          duration: 15,
          price: 15.0,
          categorySlug: "vaccinations",
          serviceSlug: "covid-vaccination",
        },
        {
          name: "Travel Clinic Consultation",
          description: "Consultation for overseas holiday vaccinations and advice.",
          duration: 30,
          price: 25.0,
          categorySlug: "travel-health",
          serviceSlug: "travel-consultation",
        },
      ],
    },
    {
      name: "Piccadilly Pharmacy",
      slug: "piccadilly-pharmacy",
      displayName: "Piccadilly Pharmacy Manchester",
      email: "manchester@nextdoorclinic.co.uk",
      phone: "0161 236 5678",
      address: "14 Piccadilly, Manchester, M1 1RG",
      postcode: "M1 1RG",
      city: "Manchester",
      latitude: 53.4808,
      longitude: -2.2393,
      brandColor: "#0F172A",
      status: TenantStatus.APPROVED,
      passwordHash: defaultPasswordHash,
      isFirstLogin: false,
      services: [
        {
          name: "UTI Clinical Consultation",
          description:
            "NHS Pharmacy First diagnostic check and prescribing service for urinary tract infections.",
          duration: 15,
          price: 0.0,
          categorySlug: "minor-ailments",
          serviceSlug: "uti-check",
        },
        {
          name: "Travel Health Check",
          description: "Quick travel health and prescription assessment.",
          duration: 20,
          price: 20.0,
          categorySlug: "travel-health",
          serviceSlug: "travel-check",
        },
      ],
    },
    {
      name: "Bullring Pharmacy",
      slug: "bullring-pharmacy",
      displayName: "Bullring Pharmacy Birmingham",
      email: "birmingham@nextdoorclinic.co.uk",
      phone: "0121 643 9012",
      address: "Bullring Shopping Centre, Birmingham, B5 4BU",
      postcode: "B5 4BU",
      city: "Birmingham",
      latitude: 52.4781,
      longitude: -1.8951,
      brandColor: "#10B981",
      status: TenantStatus.APPROVED,
      passwordHash: defaultPasswordHash,
      isFirstLogin: false,
      services: [
        {
          name: "Hair Loss Treatment Plan",
          description:
            "Male hair loss assessment and prescription medication delivery consultation.",
          duration: 15,
          price: 29.99,
          categorySlug: "mens-health",
          serviceSlug: "hair-loss-plan",
        },
        {
          name: "Erectile Dysfunction Service",
          description: "Private clinic evaluation for ED treatments.",
          duration: 15,
          price: 35.0,
          categorySlug: "mens-health",
          serviceSlug: "ed-service",
        },
      ],
    },
    {
      name: "Briggate Pharmacy",
      slug: "briggate-pharmacy",
      displayName: "Briggate Pharmacy Leeds",
      email: "leeds@nextdoorclinic.co.uk",
      phone: "0113 245 3456",
      address: "85 Briggate, Leeds, LS1 6AZ",
      postcode: "LS1 6AZ",
      city: "Leeds",
      latitude: 53.7969,
      longitude: -1.5422,
      brandColor: "#0F172A",
      status: TenantStatus.APPROVED,
      passwordHash: defaultPasswordHash,
      isFirstLogin: false,
      services: [
        {
          name: "Period Delay Consult",
          description:
            "Consultation and prescription service to delay periods for travel or events.",
          duration: 15,
          price: 24.5,
          categorySlug: "womens-health",
          serviceSlug: "period-delay",
        },
        {
          name: "Influenza Vaccination",
          description: "Annual flu jab appointment.",
          duration: 10,
          price: 12.99,
          categorySlug: "vaccinations",
          serviceSlug: "flu-jab",
        },
      ],
    },
    {
      name: "Clifton Pharmacy",
      slug: "clifton-pharmacy",
      displayName: "Clifton Pharmacy Bristol",
      email: "bristol@nextdoorclinic.co.uk",
      phone: "0117 973 7890",
      address: "45 Regent St, Clifton, Bristol, BS8 1PA",
      postcode: "BS8 1PA",
      city: "Bristol",
      latitude: 51.4584,
      longitude: -2.6202,
      brandColor: "#10B981",
      status: TenantStatus.APPROVED,
      passwordHash: defaultPasswordHash,
      isFirstLogin: false,
      services: [
        {
          name: "Sore Throat Service",
          description:
            "NHS Pharmacy First check for sore throat and prescription antibiotics if indicated.",
          duration: 15,
          price: 0.0,
          categorySlug: "minor-ailments",
          serviceSlug: "sore-throat",
        },
        {
          name: "Blood Pressure Screening",
          description: "Drop-in clinical blood pressure measurement.",
          duration: 10,
          price: 5.0,
          categorySlug: "minor-ailments",
          serviceSlug: "blood-pressure",
        },
      ],
    },
  ];

  for (const phData of pharmaciesData) {
    const { services: servicesList, ...pFields } = phData;

    // Create Pharmacy
    const createdPharmacy = await prisma.pharmacy.create({
      data: pFields,
    });

    // Create 7 Days of Availability (open 09:00 to 18:00)
    for (let day = 0; day <= 6; day++) {
      await prisma.availability.create({
        data: {
          pharmacyId: createdPharmacy.id,
          dayOfWeek: day,
          openTime: "09:00",
          closeTime: "18:00",
        },
      });
    }

    // Create Services
    for (const svc of servicesList) {
      const { categorySlug, ...svcFields } = svc;
      await prisma.service.create({
        data: {
          ...svcFields,
          pharmacyId: createdPharmacy.id,
          categoryId: categoriesMap[categorySlug] || null,
        },
      });
    }
  }

  console.log("✅ Seeded 5 pharmacies with schedules and active treatments.");
  console.log("🌟 Database Reset & Seed Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
