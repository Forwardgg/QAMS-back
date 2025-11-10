import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

console.log('[db] DEBUG: DATABASE_URL exists?', !!process.env.DATABASE_URL);
console.log('[db] DEBUG: NODE_ENV:', process.env.NODE_ENV);
console.log('[db] DEBUG: All env vars:', Object.keys(process.env));

const { Pool } = pkg;

let poolConfig;

if (process.env.DATABASE_URL) {
  // Production on Render - use connection string
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
  console.log('[db] ✅ Using DATABASE_URL for production');
} else {
  // Local development - use individual env vars
  console.log('[db] ⚠️ Using local development configuration');
  const caPath = process.env.PGSSLROOTCERT
    ? path.resolve(process.env.PGSSLROOTCERT)
    : path.resolve("certs/ca.pem");

  console.log('[db] DEBUG: Looking for CA file at:', caPath);
  
  let ssl;
  if (fs.existsSync(caPath)) {
    ssl = {
      ca: fs.readFileSync(caPath, "utf8"),
      rejectUnauthorized: true,
    };
    console.log(`[db] Using CA file: ${caPath}`);
  } else {
    console.warn(`[db] ❌ CA file not found at ${caPath}. Falling back to insecure SSL.`);
    ssl = { rejectUnauthorized: false };
  }

  poolConfig = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 14240,
    ssl,
  };
}

export const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('[db] ✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[db] ❌ Database connection error:', err);
});