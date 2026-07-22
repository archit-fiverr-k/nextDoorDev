import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function checkUsers() {
  console.log("Checking SuperAdmin...");
  const superAdmin = await db.superAdmin.findFirst();
  console.log(
    "SuperAdmin:",
    superAdmin ? { email: superAdmin.email, hash: superAdmin.passwordHash } : "None"
  );
  if (superAdmin && superAdmin.passwordHash) {
    const valid = bcrypt.compareSync("password123", superAdmin.passwordHash);
    console.log("SuperAdmin password 'password123' valid?", valid);
  }

  console.log("\nChecking Pharmacy...");
  const pharmacy = await db.pharmacy.findFirst();
  console.log(
    "Pharmacy:",
    pharmacy
      ? { email: pharmacy.email, status: pharmacy.status, hash: pharmacy.passwordHash }
      : "None"
  );
  if (pharmacy && pharmacy.passwordHash) {
    const valid = bcrypt.compareSync("password123", pharmacy.passwordHash);
    console.log("Pharmacy password 'password123' valid?", valid);
  }

  console.log("\nChecking Customer...");
  const customer = await db.customer.findFirst();
  console.log(
    "Customer:",
    customer ? { email: customer.email, hash: customer.passwordHash } : "None"
  );

  await db.$disconnect();
}

checkUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
