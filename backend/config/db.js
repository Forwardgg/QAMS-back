import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

if (process.env.NODE_ENV === "test" && fs.existsSync(".env.test")) {
  dotenv.config({ path: ".env.test" });
} else if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config();
}

const { Pool } = pkg;

const caPath = process.env.PGSSLROOTCERT
  ? path.resolve(process.env.PGSSLROOTCERT)
  : path.resolve("certs/ca.pem");

let ssl;
if (fs.existsSync(caPath)) {
  ssl = {
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: true,
  };
  console.log(`[db] Using CA file: ${caPath}`);
} else {
  console.warn(`[db] ⚠️ CA file not found at ${caPath}. Falling back to insecure SSL (dev only).`);
  ssl = { require: true, rejectUnauthorized: false };
}

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 14240,
  ssl,
});
