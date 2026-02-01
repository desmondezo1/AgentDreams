import pool from './src/db';

async function test() {
  try {
    const client = await pool.connect();
    console.log('Connected to DB!');
    const res = await client.query('SELECT NOW()');
    console.log(res.rows[0]);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('DB Error:', err);
  }
}

test();
