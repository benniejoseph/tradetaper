// ormconfig.js - CommonJS configuration for TypeORM CLI
// This file is used specifically for running migrations from the command line.

// We must use require here because this file is consumed by the TypeORM CLI as CommonJS.
const { DataSource } = require('typeorm');
require('dotenv').config(); // Load .env file for local development

// Import Cloud SQL Connector dynamically for CommonJS
let Connector;
let AuthTypes;
try {
  const cloudSqlConnector = require('@google-cloud/cloud-sql-connector');
  Connector = cloudSqlConnector.Connector;
  AuthTypes = cloudSqlConnector.AuthTypes;
} catch (e) {
  console.warn('Cloud SQL Connector not available, assuming local development:', e.message);
}

const isProduction = process.env.NODE_ENV === 'production';

async function getDataSourceOptions() {
  let dbConfig = {};

  if (isProduction && Connector && process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/')) {
    console.log('Using Cloud SQL configuration for production in ormconfig.js');
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.DB_HOST.replace('/cloudsql/', ''), // Extract instance name
      authType: AuthTypes.IAM, // Assuming IAM authentication
    });

    dbConfig = {
      ...clientOpts,
      type: 'postgres',
      database: process.env.DB_DATABASE || 'tradetaper',
      ssl: false, // SSL is handled by the connector
      retryAttempts: 5,
      retryDelay: 3000,
      connectTimeoutMS: 60000,
      extra: {
        max: 10,
        connectionTimeoutMillis: 60000,
      },
    };
  } else {
    console.log('Using local database configuration for development in ormconfig.js');
    dbConfig = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'tradetaper',
      ssl: false, // Assuming local dev doesn't use SSL
    };
  }

  return {
    ...dbConfig,
    entities: ['src/**/*.entity.ts'], // Path for CLI to find entities
    migrations: ['src/migrations/*.ts'], // Path for CLI to find migrations
    synchronize: false,
    logging: process.env.DEBUG === 'true', // Use DEBUG env var for logging
  };
}

// Export a Promise that resolves to the DataSource instance
module.exports = getDataSourceOptions().then(options => new DataSource(options));