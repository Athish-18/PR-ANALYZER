import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Construct the pool using the DATABASE_URL from your .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

async function testConnection() {
  let client;
  try {
    console.log("Attempting to connect to Neon PostgreSQL...");
    client = await pool.connect();
    console.log("✅ Successfully connected to PostgreSQL!");

    // Check PostgreSQL version
    const versionRes = await client.query('SELECT version();');
    console.log("Database Version:", versionRes.rows[0].version);

    // Verify pgvector extension
    console.log("\nChecking for pgvector extension...");
    
    // Neon databases typically come with pgvector installed, but you might need to create it
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // Query pg_extension to confirm it's active
    const vectorRes = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector';");
    if (vectorRes.rows.length > 0) {
      console.log("✅ pgvector extension is installed and active!");
    } else {
      console.log("❌ pgvector extension is NOT active.");
    }
    
  } catch (err) {
    console.error("❌ Connection error:", err.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection();
