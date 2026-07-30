import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nextdoorclinic.co.uk";
  const name = "NDC S Admin";
  const plainPassword = "Password@admin";
  const passwordHash = bcrypt.hashSync(plainPassword, 10);

  console.log(`🚀 Creating Super Admin: ${email}...`);

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: "super_admin",
      isFirstLogin: false,
    },
    create: {
      email,
      name,
      passwordHash,
      role: "super_admin",
      isFirstLogin: false,
    },
  });

  console.log("=========================================");
  console.log("✅ Super Admin Account Successfully Created!");
  console.log(`ID: ${superAdmin.id}`);
  console.log(`Name: ${superAdmin.name}`);
  console.log(`Email: ${superAdmin.email}`);
  console.log(`Password: ${plainPassword}`);
  console.log(`Role: ${superAdmin.role}`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Failed to create Super Admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
