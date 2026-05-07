import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@perfume.co" },
    update: {},
    create: {
      email: "admin@perfume.co",
      name: "Admin",
      passwordHash,
    },
  });

  console.log(`✅ Usuario admin creado: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
