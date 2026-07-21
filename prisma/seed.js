const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean existing records in reverse relation order
  console.log("🗑️ Cleaning database records...");
  await prisma.auditLog.deleteMany();
  await prisma.communicationsLog.deleteMany();
  await prisma.cRMNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.bookingOtp.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.pharmacy.deleteMany();
  await prisma.platformAdmin.deleteMany();
  await prisma.superAdmin.deleteMany();

  // 2. Hash default password once to ensure fast seeding
  const passwordHash = bcrypt.hashSync("password123", 10);
  console.log("🔑 Default password hash generated.");

  // 3. Seed Super Admin
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email: "superadmin@nextdoorclinic.com",
      name: "Elizabeth Vance",
      passwordHash,
      isFirstLogin: false,
    },
  });
  console.log(`👤 Seeded Super Admin: ${superAdmin.email}`);

  // 4. Seed Platform Admins
  const platformAdminsData = [
    { email: "admin1@nextdoorclinic.com", name: "David Vance", isFirstLogin: false },
    { email: "admin2@nextdoorclinic.com", name: "Sarah Connor", isFirstLogin: true },
  ];

  for (const admin of platformAdminsData) {
    const pAdmin = await prisma.platformAdmin.create({
      data: {
        email: admin.email,
        name: admin.name,
        passwordHash,
        isFirstLogin: admin.isFirstLogin,
        isActive: true,
      },
    });
    console.log(`👥 Seeded Platform Admin: ${pAdmin.email}`);
  }

  // 5. Seed Pharmacies
  const pharmaciesData = [
    {
      name: "London Care Pharmacy",
      slug: "london-care",
      email: "london@pharmacy.com",
      phone: "020-7946-0192",
      address: "Buckingham Palace Rd, London SW1A 1AA",
      status: "APPROVED",
      isFirstLogin: false,
      latitude: 51.501,
      longitude: -0.142,
      postcode: "SW1A 1AA",
      city: "London",
    },
    {
      name: "Manchester Meds",
      slug: "manchester-meds",
      email: "manchester@pharmacy.com",
      phone: "0161-496-0182",
      address: "Deansgate, Manchester M2 4WQ",
      status: "APPROVED",
      isFirstLogin: false,
      latitude: 53.4815,
      longitude: -2.2467,
      postcode: "M2 4WQ",
      city: "Manchester",
    },
    {
      name: "Leeds Wellness",
      slug: "leeds-wellness",
      email: "leeds@pharmacy.com",
      phone: "0113-496-0210",
      address: "Woodhouse Lane, Leeds LS2 3AX",
      status: "APPROVED",
      isFirstLogin: false,
      latitude: 53.8015,
      longitude: -1.539,
      postcode: "LS2 3AX",
      city: "Leeds",
    },
    {
      name: "Bristol Apothecary",
      slug: "bristol-apothecary",
      email: "bristol@pharmacy.com",
      phone: "0117-496-0329",
      address: "Clifton, Bristol BS8 1EG",
      status: "APPROVED",
      isFirstLogin: false,
      latitude: 51.4578,
      longitude: -2.6201,
      postcode: "BS8 1EG",
      city: "Bristol",
    },
    {
      name: "Birmingham Health",
      slug: "birmingham-health",
      email: "birmingham@pharmacy.com",
      phone: "0121-496-0450",
      address: "New Street, Birmingham B2 4ND",
      status: "PENDING",
      isFirstLogin: true,
      latitude: 52.4789,
      longitude: -1.8967,
      postcode: "B2 4ND",
      city: "Birmingham",
    },
  ];

  const pharmacies = [];
  for (const pharmData of pharmaciesData) {
    const pharmacy = await prisma.pharmacy.create({
      data: {
        ...pharmData,
        passwordHash,
      },
    });
    pharmacies.push(pharmacy);
    console.log(`🏥 Seeded Pharmacy: ${pharmacy.name} (${pharmacy.status})`);

    // Seed Availability (Mon-Fri 9AM-6PM, Sat 9AM-1PM)
    const availabilities = [
      { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00" }, // Mon
      { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00" }, // Tue
      { dayOfWeek: 3, openTime: "09:00", closeTime: "18:00" }, // Wed
      { dayOfWeek: 4, openTime: "09:00", closeTime: "18:00" }, // Thu
      { dayOfWeek: 5, openTime: "09:00", closeTime: "18:00" }, // Fri
      { dayOfWeek: 6, openTime: "09:00", closeTime: "13:00" }, // Sat
    ];

    for (const avail of availabilities) {
      await prisma.availability.create({
        data: {
          pharmacyId: pharmacy.id,
          ...avail,
        },
      });
    }

    // Seed Blocked Dates (Holidays)
    const blockedDates = [
      { date: new Date("2026-11-26"), reason: "Thanksgiving Day" },
      { date: new Date("2026-12-25"), reason: "Christmas Day" },
      { date: new Date("2027-01-01"), reason: "New Year's Day" },
    ];

    for (const blocked of blockedDates) {
      await prisma.blockedDate.create({
        data: {
          pharmacyId: pharmacy.id,
          date: blocked.date,
          reason: blocked.reason,
        },
      });
    }
  }

  // 6. Seed Services (20 Services in total, 4 per Pharmacy)
  const serviceTemplates = [
    {
      name: "Annual Flu Vaccination",
      desc: "Standard quadrivalent influenza immunizations.",
      dur: 15,
      price: 25.0,
    },
    {
      name: "COVID-19 Booster Shot",
      desc: "Latest updated bivalent strain vaccine.",
      dur: 15,
      price: 35.0,
    },
    {
      name: "Comprehensive Health Screening",
      desc: "Cholesterol profile, blood glucose, and vitals check.",
      dur: 30,
      price: 75.0,
    },
    {
      name: "Medication Therapy Assessment",
      desc: "One-on-one review of all prescriptions and supplements.",
      dur: 45,
      price: 60.0,
    },
  ];

  const services = [];
  for (const pharmacy of pharmacies) {
    for (const template of serviceTemplates) {
      const service = await prisma.service.create({
        data: {
          pharmacyId: pharmacy.id,
          name: template.name,
          description: template.desc,
          duration: template.dur,
          price: template.price,
          isActive: true,
        },
      });
      services.push(service);
    }
  }
  console.log(`💉 Seeded ${services.length} services across pharmacies.`);

  // 7. Seed Customers (20 Customers distributed across pharmacies)
  const customerNames = [
    { first: "John", last: "Doe", email: "john.doe@gmail.com", phone: "312-555-9011" },
    { first: "Jane", last: "Smith", email: "jane.smith@gmail.com", phone: "312-555-9022" },
    { first: "Michael", last: "Johnson", email: "michael.j@hotmail.com", phone: "312-555-9033" },
    { first: "Emily", last: "Davis", email: "emily.davis@yahoo.com", phone: "312-555-9044" },
    { first: "William", last: "Brown", email: "wbrown@gmail.com", phone: "773-555-9055" },
    { first: "Olivia", last: "Jones", email: "olivia.jones@gmail.com", phone: "773-555-9066" },
    { first: "James", last: "Miller", email: "jmiller@outlook.com", phone: "312-555-9077" },
    { first: "Sophia", last: "Wilson", email: "sophia.w@gmail.com", phone: "312-555-9088" },
    { first: "Benjamin", last: "Moore", email: "ben.moore@gmail.com", phone: "847-555-9099" },
    { first: "Isabella", last: "Taylor", email: "isabella.t@gmail.com", phone: "847-555-9110" },
    { first: "Lucas", last: "Anderson", email: "lucas.a@gmail.com", phone: "312-555-9121" },
    { first: "Mia", last: "Thomas", email: "mia.thomas@gmail.com", phone: "312-555-9132" },
    { first: "Henry", last: "Jackson", email: "hjackson@gmail.com", phone: "773-555-9143" },
    { first: "Charlotte", last: "White", email: "charlotte.w@gmail.com", phone: "773-555-9154" },
    { first: "Alexander", last: "Harris", email: "alex.harris@gmail.com", phone: "312-555-9165" },
    { first: "Amelia", last: "Martin", email: "amelia.m@gmail.com", phone: "312-555-9176" },
    { first: "Daniel", last: "Thompson", email: "dan.thompson@gmail.com", phone: "847-555-9187" },
    { first: "Harper", last: "Garcia", email: "harper.garcia@gmail.com", phone: "847-555-9198" },
    { first: "Matthew", last: "Martinez", email: "matthew.m@gmail.com", phone: "312-555-9209" },
    { first: "Evelyn", last: "Robinson", email: "evelyn.r@gmail.com", phone: "312-555-9220" },
  ];

  const customers = [];
  // Distribute customers 4 per pharmacy across the 5 pharmacies
  for (let i = 0; i < customerNames.length; i++) {
    const pharmIndex = i % pharmacies.length;
    const targetPharmacy = pharmacies[pharmIndex];
    const data = customerNames[i];

    const customer = await prisma.customer.create({
      data: {
        pharmacyId: targetPharmacy.id,
        firstName: data.first,
        lastName: data.last,
        email: data.email,
        phone: data.phone,
        dateOfBirth: new Date("1985-05-15"), // Static dummy DOB
      },
    });
    customers.push(customer);
  }
  console.log(`👤 Seeded ${customers.length} customers across pharmacies.`);

  // 8. Seed Appointments (50 Appointments distributed across pharmacies)
  console.log("📆 Seeding appointments...");
  const appointmentStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

  // Generate appointments for dates in 2026/2027
  let appointmentsSeeded = 0;
  for (let i = 0; i < 50; i++) {
    const customer = customers[i % customers.length];
    const pharmacyId = customer.pharmacyId;

    // Get services configured for this pharmacy
    const pharmacyServices = services.filter((s) => s.pharmacyId === pharmacyId);
    if (pharmacyServices.length === 0) continue;
    const service = pharmacyServices[i % pharmacyServices.length];

    // Pick slot in 2026
    const baseDate = new Date("2026-08-10T09:00:00Z");
    baseDate.setDate(baseDate.getDate() + i * 2); // Spread dates out
    const startTime = new Date(baseDate);
    const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

    const status = appointmentStatuses[i % appointmentStatuses.length];

    await prisma.appointment.create({
      data: {
        pharmacyId,
        customerId: customer.id,
        serviceId: service.id,
        startTime,
        endTime,
        status,
        notes: `Patient requested appointment for ${service.name}.`,
      },
    });
    appointmentsSeeded++;
  }
  console.log(`✅ Seeded ${appointmentsSeeded} appointments successfully.`);

  console.log("\n=======================================================");
  console.log("🔑 DATABASE SEED COMPLETE. LOGIN CREDENTIALS:");
  console.log("-------------------------------------------------------");
  console.log("1. Super Admin:");
  console.log("   - Email: superadmin@nextdoorclinic.com");
  console.log("   - Password: password123");
  console.log("2. Platform Admins:");
  console.log("   - Email: admin1@nextdoorclinic.com (isFirstLogin: false)");
  console.log("   - Email: admin2@nextdoorclinic.com (isFirstLogin: true)");
  console.log("   - Password: password123");
  console.log("3. Pharmacy Owners (Tenants):");
  console.log("   - Email: downtown@pharmacy.com (isFirstLogin: false, slug: downtown-care)");
  console.log("   - Email: westside@pharmacy.com (isFirstLogin: false, slug: westside-meds)");
  console.log("   - Email: northside@pharmacy.com (isFirstLogin: false, slug: northside-wellness)");
  console.log("   - Email: metro@pharmacy.com (isFirstLogin: true, slug: metro-rx)");
  console.log("   - Email: summit@pharmacy.com (isFirstLogin: true, slug: summit-apothecary)");
  console.log("   - Password: password123");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
