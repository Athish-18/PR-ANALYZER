import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    global.dbError = error.message;
  }
};
