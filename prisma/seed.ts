/**
 * Safe starter records. No public articles, paid content, or demo accounts are
 * created by default. Add reviewed material through the admin UI before launch.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  for (const category of [
    { name: "Living in Thailand", slug: "living-in-thailand" },
    { name: "Travel", slug: "travel" },
    { name: "Culture", slug: "culture" },
  ]) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || "Administrator";
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 16) {
      throw new Error("ADMIN_PASSWORD must contain at least 16 characters");
    }
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { name: adminName, role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 12), authVersion: { increment: 1 } },
      create: {
        email: adminEmail,
        name: adminName,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "ADMIN",
      },
    });
    console.log("Admin account is ready.");
  } else {
    console.log("Set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin account.");
  }

  console.log("Starter categories are ready. No unreviewed content was published.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
