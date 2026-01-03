import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "arsam12sb@gmail.com";
  const password = "FaR1619*";
  const hash = await bcrypt.hash(password, 10);

  const owner = await prisma.user.upsert({
    where: { email },
    update: { role: Role.OWNER, password: hash, status: "active", name: "مالک اصلی" },
    create: {
      email,
      password: hash,
      role: Role.OWNER,
      name: "مالک اصلی",
      status: "active",
    },
  });

  console.log("Owner ensured:", owner.id, owner.email, owner.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
