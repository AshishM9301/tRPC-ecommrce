import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const rolesToCreate: { name: RoleName }[] = [
    { name: RoleName.SUPER_ADMIN },
    { name: RoleName.ADMIN },
    { name: RoleName.SELLER },
    { name: RoleName.CUSTOMER },
  ];

  for (const roleData of rolesToCreate) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: { name: roleData.name },
    });
    console.log(`Created or found role: ${role.name} with id: ${role.id}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  }); 