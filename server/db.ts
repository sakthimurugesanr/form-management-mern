import 'dotenv/config';
import pg from 'pg';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Copy .env.example to .env and configure PostgreSQL or Neon.');
// pg honors sslmode=require from Neon connection strings; certificate verification is not disabled.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
pool.on('error', () => console.error('Unexpected database connection error'));
