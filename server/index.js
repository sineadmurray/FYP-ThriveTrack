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

      -- Mood entries table (already existed)
      CREATE TABLE IF NOT EXISTS mood_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        mood TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON mood_entries(user_id);

      -- NEW: End of Day / Daily Reflection table
      CREATE TABLE IF NOT EXISTS end_of_day_reflections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        went_well TEXT,
        learned TEXT,
        proud_of TEXT,
        self_care TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_eod_reflections_user ON end_of_day_reflections(user_id);
    `);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'init_failed' });
  }
});

// create mood entry
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

// list mood entries
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

// update one mood entry
app.put('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mood, notes } = req.body;

    if (!mood) {
      return res.status(400).json({ error: 'mood is required' });
    }

    const { rows } = await pool.query(
      'UPDATE mood_entries SET mood=$2, notes=$3 WHERE id=$1 RETURNING *',
      [id, mood, notes ?? null]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'update_failed' });
  }
});

// delete one mood entry
app.delete('/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM mood_entries WHERE id=$1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.status(204).send(); // no content
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'delete_failed' });
  }
});

// create end-of-day reflection
app.post('/end-of-day-reflections', async (req, res) => {
  try {
    const { user_id, went_well, learned, proud_of, self_care } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO end_of_day_reflections
        (user_id, went_well, learned, proud_of, self_care)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [user_id, went_well ?? null, learned ?? null, proud_of ?? null, self_care ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'eod_create_failed' });
  }
});

// list end-of-day reflections
app.get('/end-of-day-reflections', async (req, res) => {
  try {
    const { user_id } = req.query;
    const q = user_id
      ? {
          text: 'SELECT * FROM end_of_day_reflections WHERE user_id=$1 ORDER BY created_at DESC',
          values: [user_id],
        }
      : {
          text: 'SELECT * FROM end_of_day_reflections ORDER BY created_at DESC',
          values: [],
        };

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'eod_list_failed' });
  }
});

// update one end-of-day reflection
app.put('/end-of-day-reflections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { went_well, learned, proud_of, self_care } = req.body;

    const { rows } = await pool.query(
      `UPDATE end_of_day_reflections
       SET went_well=$2, learned=$3, proud_of=$4, self_care=$5
       WHERE id=$1
       RETURNING *`,
      [id, went_well ?? null, learned ?? null, proud_of ?? null, self_care ?? null]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'eod_update_failed' });
  }
});

// delete one end-of-day reflection
app.delete('/end-of-day-reflections/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM end_of_day_reflections WHERE id=$1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'eod_delete_failed' });
  }
});



const port = process.env.PORT || 4000;

// bind to all interfaces so phone can reach it over Wi-Fi
app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${port}`);
  console.log('Try from phone browser:  http://192.168.1.23:4000/health');
});
