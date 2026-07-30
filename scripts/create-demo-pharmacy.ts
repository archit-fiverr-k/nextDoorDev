import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "pharmacy@nextdoorclinic.co.uk";
  const name = "Next Door Clinic";
  const slug = "next-door-clinic";
  const plainPassword = "password123";
  const passwordHash = bcrypt.hashSync(plainPassword, 10);

  console.log(`🚀 Creating Demo Pharmacy: ${name} (${email})...`);

  const pharmacy = await prisma.pharmacy.upsert({
    where: { email },
    update: {
      name,
      slug,
      passwordHash,
      role: "pharmacy",
      status: "APPROVED",
      isFirstLogin: false,
      phone: "+442079460912",
      address: "123 Healthcare Way, London",
      postcode: "EC1A 1BB",
      city: "London",
      brandColor: "#10B981",
    },
    create: {
      email,
      name,
      slug,
      passwordHash,
      role: "pharmacy",
      status: "APPROVED",
      isFirstLogin: false,
      phone: "+442079460912",
      address: "123 Healthcare Way, London",
      postcode: "EC1A 1BB",
      city: "London",
      brandColor: "#10B981",
    },
  });

  // Enable all active Master Services for this pharmacy
  const masterServices = await prisma.masterService.findMany({
    where: { status: "ACTIVE" },
  });

  console.log(`🩺 Linking ${masterServices.length} master services to demo pharmacy...`);

  for (const masterSvc of masterServices) {
    await prisma.pharmacyService.upsert({
      where: {
        pharmacyId_masterServiceId: {
          pharmacyId: pharmacy.id,
          masterServiceId: masterSvc.id,
        },
      },
      update: {
        enabled: true,
        priceOverride: masterSvc.defaultPrice,
      },
      create: {
        pharmacyId: pharmacy.id,
        masterServiceId: masterSvc.id,
        enabled: true,
        priceOverride: masterSvc.defaultPrice,
      },
    });
  }

  // Create default availability schedule (Monday - Saturday 09:00 - 18:00)
  console.log(`📅 Setting weekly availability schedule...`);
  for (let day = 1; day <= 6; day++) {
    await prisma.availability.upsert({
      where: {
        pharmacyId_dayOfWeek: {
          pharmacyId: pharmacy.id,
          dayOfWeek: day,
        },
      },
      update: {
        openTime: "09:00",
        closeTime: "18:00",
      },
      create: {
        pharmacyId: pharmacy.id,
        dayOfWeek: day,
        openTime: "09:00",
        closeTime: "18:00",
      },
    });
  }

  console.log("=========================================");
  console.log("✅ Demo Pharmacy Account Successfully Created!");
  console.log(`Pharmacy ID: ${pharmacy.id}`);
  console.log(`Name: ${pharmacy.name}`);
  console.log(`Slug: ${pharmacy.slug}`);
  console.log(`Email: ${pharmacy.email}`);
  console.log(`Password: ${plainPassword}`);
  console.log(`Role: ${pharmacy.role}`);
  console.log(`Status: ${pharmacy.status}`);
  console.log(`Services Enabled: ${masterServices.length}`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Failed to create demo pharmacy:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
