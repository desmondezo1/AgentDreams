import dotenv from 'dotenv';

dotenv.config();

// Use in-memory database if DATABASE_URL is not set
let dbQuery: (text: string, params?: any[]) => Promise<{rows: any[]}>;
let dbGetClient: () => Promise<any>;
let dbDefault: any;

if (process.env.DATABASE_URL) {
  // Use PostgreSQL
  console.log('[DB] Using PostgreSQL database');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  dbQuery = (text: string, params?: any[]) => pool.query(text, params);
  dbGetClient = () => pool.connect();
  dbDefault = pool;
} else {
  // Use in-memory database
  console.log('[DB] Using in-memory database (set DATABASE_URL for PostgreSQL)');
  const memdb = require('./memorydb');
  dbQuery = memdb.query;
  dbGetClient = memdb.getClient;
  dbDefault = memdb.default;
}

export const query = dbQuery;
export const getClient = dbGetClient;
export default dbDefault;
