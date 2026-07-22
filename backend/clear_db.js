const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  // Delete all users. Assuming onDelete: Cascade is configured for most things.
  // If not, we might need to delete other tables first.
  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`Deleted ${deletedUsers.count} users and their related data.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
