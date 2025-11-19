import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import morgan from 'morgan';

const { Pool } = pkg;

const app = express();

// CORS + JSON
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json());
app.use(morgan('dev')); // logs requests

console.log("DATABASE_URL =", process.env.DATABASE_URL);
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://sineadmurray@localhost:5432/thrivetrack",
});


// health
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// init
app.post('/init', async (_req, res) => {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE IF NOT EXISTS mood_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        mood TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON mood_entries(user_id);
    `);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'init_failed' });
  }
});

// create
app.post('/entries', async (req, res) => {
  try {
    const { user_id, mood, notes } = req.body;
    if (!user_id || !mood) {
      return res.status(400).json({ error: 'user_id and mood are required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO mood_entries (user_id, mood, notes) VALUES ($1,$2,$3) RETURNING *',
      [user_id, mood, notes ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'create_failed' });
  }
});

// list
app.get('/entries', async (req, res) => {
  try {
    const { user_id } = req.query;
    const q = user_id
      ? { text: 'SELECT * FROM mood_entries WHERE user_id=$1 ORDER BY created_at DESC', values: [user_id] }
      : { text: 'SELECT * FROM mood_entries ORDER BY created_at DESC', values: [] };
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'list_failed' });
  }
});

const port = process.env.PORT || 4000;

// bind to all interfaces so phone can reach it over Wi-Fi
app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${port}`);
  console.log('Try from phone browser:  http://192.168.1.23:4000/health');
});
