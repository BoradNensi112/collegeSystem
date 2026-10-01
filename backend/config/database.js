const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbHost = process.env.DB_HOST || "127.0.0.1";
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const dbDatabase = process.env.DB_NAME || process.env.DB_DATABASE || "NavNext";
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "nenuborad@112";
const dbDialect = "postgres";

let msHrms;

if (process.env.DATABASE_URL) {
  // Cloud Managed PostgreSQL (Render, Neon, Supabase, Railway, etc.)
  msHrms = new Sequelize(process.env.DATABASE_URL, {
    dialect: dbDialect,
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Local or Standard Environment Variable Connection
  const dialectOptions = process.env.DB_SSL === 'true' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {};

  msHrms = new Sequelize(dbDatabase, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    dialectOptions
  });
}

module.exports = msHrms;