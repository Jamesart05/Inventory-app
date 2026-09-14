require('dotenv').config({ path: './.env' });

/** @type {import('prisma').PrismaConfig} */
module.exports = {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_7QROZrkBFoy2@ep-quiet-field-a5ioyyw3.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connection_limit=1',
  },
};