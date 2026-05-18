const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = "postgresql://postgres.euxayzxxkyzmspxlnrem:Tuananh2005%40@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log(JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
