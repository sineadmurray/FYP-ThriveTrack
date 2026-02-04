import 'dotenv/config'; // Loads environment variables from .env into process.env
import express from 'express'; // Import the main server framework
import cors from 'cors'; // CORS allows mobile app to connect to your API from a different origin
import pkg from 'pg'; // PostgreSQL client library
import morgan from 'morgan'; // HTTP request logger (shows GET, POST, etc. in the terminal)

const { Pool } = pkg; // Extract the Pool class (used for database connections)

const app = express(); // Create an Express application instance

// CORS + JSON
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] })); // Allow all origins (mobile phone, Expo tunnel, web etc.)
app.use(express.json()); // Parse incoming JSON in request bodies
app.use(morgan('dev')); // Log every request in the terminal (useful for debugging)

console.log("DATABASE_URL =", process.env.DATABASE_URL); // Log the connection string for debugging purposes
const pool = new Pool({ // Create a PostgreSQL connection pool
  connectionString:
    process.env.DATABASE_URL || 
    "postgresql://sineadmurray@localhost:5432/thrivetrack", // fallback for local dev
});


// health
// Used to confirm the API and database are online.
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1'); // Simple query to ensure DB works
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// init
// This route sets up all the tables in PostgreSQL.
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

      --End of Day / Daily Reflection table
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

      CREATE TABLE IF NOT EXISTS trap_and_track (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        circumstance TEXT,
        trigger TEXT,
        response TEXT,
        avoidance TEXT,
        consequence TEXT,
        copingstrategy TEXT,
        tryalternative TEXT,
        consequenceafter TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_trap_and_track_user ON trap_and_track(user_id);

      -- Gratitude entries table
      CREATE TABLE IF NOT EXISTS gratitude_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user ON gratitude_entries(user_id);

      -- Outside-In actions
      CREATE TABLE IF NOT EXISTS outside_in_actions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        prompt_id INT NOT NULL REFERENCES outside_in_prompts(id) ON DELETE CASCADE,
        action_text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_outside_in_actions_user ON outside_in_actions(user_id);
      CREATE INDEX IF NOT EXISTS idx_outside_in_actions_prompt ON outside_in_actions(prompt_id);

      -- Where I Am Now / Where I Want To Be
      CREATE TABLE IF NOT EXISTS where_i_am_reflections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,

        mind_now TEXT,
        mind_want TEXT,

        body_now TEXT,
        body_want TEXT,

        career_now TEXT,
        career_want TEXT,

        relationships_now TEXT,
        relationships_want TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_where_i_am_user ON where_i_am_reflections(user_id);

      -- Weekly Reflections & Review
      CREATE TABLE IF NOT EXISTS weekly_reflections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,

        mind TEXT,
        body TEXT,
        career TEXT,
        relationships TEXT,

        held_me_back TEXT,
        lesson_learned TEXT,
        next_weeks_focus TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user ON weekly_reflections(user_id);

      -- Daily Planner
      CREATE TABLE IF NOT EXISTS daily_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,

        main_goal TEXT,
        priority_1 TEXT,
        priority_2 TEXT,
        priority_3 TEXT,

        other_todos TEXT,
        self_care_actions TEXT,
        productivity_reward TEXT,
        notes TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_daily_plans_user ON daily_plans(user_id);

      -- Long-Term Vision
      CREATE TABLE IF NOT EXISTS long_term_visions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,

        vision TEXT,
        clear_direction TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_long_term_visions_user ON long_term_visions(user_id);

    `);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'init_failed' });
  }
});

// create mood entry
app.post('/mood_entries', async (req, res) => {
  try {
    const { user_id, mood, mood_value, notes } = req.body;

    if (!user_id || !mood || !mood_value) {
      return res.status(400).json({
        error: 'user_id, mood, and mood_value are required'
      });
    }

    // safety: enforce valid range
    if (mood_value < 1 || mood_value > 5) {
      return res.status(400).json({
        error: 'mood_value must be between 1 and 5'
      });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO mood_entries (user_id, mood, mood_value, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [user_id, mood, mood_value, notes ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'create_failed' });
  }
});


// list mood entries
app.get('/mood_entries', async (req, res) => {
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
app.put('/mood_entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mood, mood_value, notes } = req.body;

    if (!mood || !mood_value) {
      return res.status(400).json({
        error: 'mood and mood_value are required'
      });
    }

    if (mood_value < 1 || mood_value > 5) {
      return res.status(400).json({
        error: 'mood_value must be between 1 and 5'
      });
    }

    const { rows } = await pool.query(
      `
      UPDATE mood_entries
      SET mood=$2,
          mood_value=$3,
          notes=$4
      WHERE id=$1
      RETURNING *
      `,
      [id, mood, mood_value, notes ?? null]
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
app.delete('/mood_entries/:id', async (req, res) => {
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


// create trap & track entry
app.post('/trap_and_track', async (req, res) => {
  try {
    const {
      user_id,
      circumstance,
      trigger,
      response,
      avoidance,
      consequence,
      copingstrategy,
      tryalternative,
      consequenceafter,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO trap_and_track
        (user_id, circumstance, trigger, response, avoidance, consequence, copingstrategy, tryalternative, consequenceafter)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        user_id,
        circumstance ?? null,
        trigger ?? null,
        response ?? null,
        avoidance ?? null,
        consequence ?? null,
        copingstrategy ?? null,
        tryalternative ?? null,
        consequenceafter ?? null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'tt_create_failed' });
  }
});

// list trap & track entries 
app.get('/trap_and_track', async (req, res) => {
  try {
    const { user_id } = req.query;

    const q = user_id
      ? {
          text: 'SELECT * FROM trap_and_track WHERE user_id=$1 ORDER BY created_at DESC',
          values: [user_id],
        }
      : {
          text: 'SELECT * FROM trap_and_track ORDER BY created_at DESC',
          values: [],
        };

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'tt_list_failed' });
  }
});

// update one trap & track entry
app.put('/trap_and_track/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      circumstance,
      trigger,
      response,
      avoidance,
      consequence,
      copingstrategy,
      tryalternative,
      consequenceafter,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE trap_and_track
       SET circumstance=$2,
           trigger=$3,
           response=$4,
           avoidance=$5,
           consequence=$6,
           copingstrategy=$7,
           tryalternative=$8,
           consequenceafter=$9
       WHERE id=$1
       RETURNING *`,
      [
        id,
        circumstance ?? null,
        trigger ?? null,
        response ?? null,
        avoidance ?? null,
        consequence ?? null,
        copingstrategy ?? null,
        tryalternative ?? null,
        consequenceafter ?? null,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'tt_update_failed' });
  }
});

// delete one trap & track entry
app.delete('/trap_and_track/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM trap_and_track WHERE id=$1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'tt_delete_failed' });
  }
});

// create gratitude entry
app.post("/gratitude_entries", async (req, res) => {
  try {
    const { user_id, text } = req.body;

    if (!user_id || !text || !text.trim()) {
      return res.status(400).json({ error: "user_id and text are required" });
    }

    const { rows } = await pool.query(
      "INSERT INTO gratitude_entries (user_id, text) VALUES ($1,$2) RETURNING *",
      [user_id, text.trim()]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gratitude_create_failed" });
  }
});

// list gratitude entries
app.get("/gratitude_entries", async (req, res) => {
  try {
    const { user_id } = req.query;

    const q = user_id
      ? {
          text: "SELECT * FROM gratitude_entries WHERE user_id=$1 ORDER BY created_at DESC",
          values: [user_id],
        }
      : {
          text: "SELECT * FROM gratitude_entries ORDER BY created_at DESC",
          values: [],
        };

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gratitude_list_failed" });
  }
});

// update one gratitude entry
app.put("/gratitude_entries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    const { rows } = await pool.query(
      "UPDATE gratitude_entries SET text=$2 WHERE id=$1 RETURNING *",
      [id, text.trim()]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gratitude_update_failed" });
  }
});

// delete one gratitude entry
app.delete("/gratitude_entries/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM gratitude_entries WHERE id=$1", [
      id,
    ]);

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gratitude_delete_failed" });
  }
});

// get random motivational quote
app.get("/quotes/random", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT quote_text, author
       FROM motivational_quotes
       ORDER BY RANDOM()
       LIMIT 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "no_quotes" });
    }

    res.json(rows[0]); // { quote_text, author }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "quote_random_failed" });
  }
});

// Get 1 random Outside-In prompt
app.get("/outside_in/random", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, prompt_text
       FROM outside_in_prompts
       ORDER BY RANDOM()
       LIMIT 1`
    );

    if (rows.length === 0) return res.status(404).json({ error: "no_prompts" });

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_random_failed" });
  }
});

// Get inspirations (3 random) for a specific prompt
app.get("/outside_in/:promptId/inspirations", async (req, res) => {
  try {
    const { promptId } = req.params;

    const { rows } = await pool.query(
      `SELECT inspiration_text
       FROM outside_in_inspirations
       WHERE prompt_id = $1
       ORDER BY RANDOM()
       LIMIT 3`,
      [promptId]
    );

      res.json(rows); // [{ inspiration_text }, ...]
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_inspirations_failed" });
  }
});

// create outside-in action
app.post("/outside_in_actions", async (req, res) => {
  try {
    const { user_id, prompt_id, action_text } = req.body;

    if (!user_id || !prompt_id || !action_text || !action_text.trim()) {
      return res.status(400).json({ error: "user_id, prompt_id and action_text are required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO outside_in_actions (user_id, prompt_id, action_text)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [user_id, prompt_id, action_text.trim()]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_action_create_failed" });
  }
});

// list outside-in actions
app.get("/outside_in_actions", async (req, res) => {
  try {
    const { user_id } = req.query;

    const q = user_id
      ? {
          text: `SELECT *
                 FROM outside_in_actions
                 WHERE user_id=$1
                 ORDER BY created_at DESC`,
          values: [user_id],
        }
      : {
          text: `SELECT *
                 FROM outside_in_actions
                 ORDER BY created_at DESC`,
          values: [],
        };

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_action_list_failed" });
  }
});

// update one outside-in action
app.put("/outside_in_actions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { action_text } = req.body;

    if (!action_text || !action_text.trim()) {
      return res.status(400).json({ error: "action_text is required" });
    }

    const { rows } = await pool.query(
      `UPDATE outside_in_actions
       SET action_text=$2
       WHERE id=$1
       RETURNING *`,
      [id, action_text.trim()]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_action_update_failed" });
  }
});

// delete one outside-in action
app.delete("/outside_in_actions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM outside_in_actions WHERE id=$1`,
      [id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_action_delete_failed" });
  }
});


// create where-i-am reflection
app.post("/where_i_am_reflections", async (req, res) => {
  try {
    const {
      user_id,
      mind_now, mind_want,
      body_now, body_want,
      career_now, career_want,
      relationships_now, relationships_want,
    } = req.body;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const { rows } = await pool.query(
      `INSERT INTO where_i_am_reflections
       (user_id, mind_now, mind_want, body_now, body_want, career_now, career_want, relationships_now, relationships_want)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        user_id,
        mind_now ?? null, mind_want ?? null,
        body_now ?? null, body_want ?? null,
        career_now ?? null, career_want ?? null,
        relationships_now ?? null, relationships_want ?? null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "whereiam_create_failed" });
  }
});

// list where-i-am reflections
app.get("/where_i_am_reflections", async (req, res) => {
  try {
    const { user_id } = req.query;

    const q = user_id
      ? {
          text: "SELECT * FROM where_i_am_reflections WHERE user_id=$1 ORDER BY created_at DESC",
          values: [user_id],
        }
      : {
          text: "SELECT * FROM where_i_am_reflections ORDER BY created_at DESC",
          values: [],
        };

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "whereiam_list_failed" });
  }
});

// update one where-i-am reflection
app.put("/where_i_am_reflections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mind_now, mind_want,
      body_now, body_want,
      career_now, career_want,
      relationships_now, relationships_want,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE where_i_am_reflections
       SET mind_now=$2, mind_want=$3,
           body_now=$4, body_want=$5,
           career_now=$6, career_want=$7,
           relationships_now=$8, relationships_want=$9
       WHERE id=$1
       RETURNING *`,
      [
        id,
        mind_now ?? null, mind_want ?? null,
        body_now ?? null, body_want ?? null,
        career_now ?? null, career_want ?? null,
        relationships_now ?? null, relationships_want ?? null,
      ]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "whereiam_update_failed" });
  }
});

// delete one where_i_am_reflection
app.delete("/where_i_am_reflections/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM where_i_am_reflections WHERE id=$1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "whereiam_delete_failed" });
  }
});

// create weekly reflection
app.post("/weekly_reflections", async (req, res) => {
  try {
    const {
      user_id,
      mind, body, career, relationships,
      held_me_back,
      lesson_learned,
      next_weeks_focus,
    } = req.body;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const { rows } = await pool.query(
      `INSERT INTO weekly_reflections
       (user_id, mind, body, career, relationships, held_me_back, lesson_learned, next_weeks_focus)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        user_id,
        mind ?? null,
        body ?? null,
        career ?? null,
        relationships ?? null,
        held_me_back ?? null,
        lesson_learned ?? null,
        next_weeks_focus ?? null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "weekly_create_failed" });
  }
});

// list weekly reflections
app.get("/weekly_reflections", async (req, res) => {
  try {
    const { user_id } = req.query;

    const q = user_id
      ? {
          text: "SELECT * FROM weekly_reflections WHERE user_id=$1 ORDER BY created_at DESC",
          values: [user_id],
        }
      : {
          text: "SELECT * FROM weekly_reflections ORDER BY created_at DESC",
          values: [],
        };

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "weekly_list_failed" });
  }
});

// update one weekly reflection
app.put("/weekly_reflections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mind, body, career, relationships,
      held_me_back,
      lesson_learned,
      next_weeks_focus,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE weekly_reflections
       SET mind=$2, body=$3, career=$4, relationships=$5,
           held_me_back=$6, lesson_learned=$7, next_weeks_focus=$8
       WHERE id=$1
       RETURNING *`,
      [
        id,
        mind ?? null,
        body ?? null,
        career ?? null,
        relationships ?? null,
        held_me_back ?? null,
        lesson_learned ?? null,
        next_weeks_focus ?? null,
      ]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "weekly_update_failed" });
  }
});

// delete one weekly reflection
app.delete("/weekly_reflections/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM weekly_reflections WHERE id=$1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "weekly_delete_failed" });
  }
});

// create daily plan
app.post("/daily_plans", async (req, res) => {
  try {
    const {
      user_id,
      main_goal,
      priority_1,
      priority_2,
      priority_3,
      other_todos,
      self_care_actions,
      productivity_reward,
      notes,
    } = req.body;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const { rows } = await pool.query(
      `INSERT INTO daily_plans
       (user_id, main_goal, priority_1, priority_2, priority_3, other_todos, self_care_actions, productivity_reward, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        user_id,
        main_goal ?? null,
        priority_1 ?? null,
        priority_2 ?? null,
        priority_3 ?? null,
        other_todos ?? null,
        self_care_actions ?? null,
        productivity_reward ?? null,
        notes ?? null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "dailyplan_create_failed" });
  }
});

// list daily plans
app.get("/daily_plans", async (req, res) => {
  try {
    const { user_id } = req.query;

    const q = user_id
      ? {
          text: "SELECT * FROM daily_plans WHERE user_id=$1 ORDER BY created_at DESC",
          values: [user_id],
        }
      : {
          text: "SELECT * FROM daily_plans ORDER BY created_at DESC",
          values: [],
        };

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "dailyplan_list_failed" });
  }
});

// update one daily plan
app.put("/daily_plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      main_goal,
      priority_1,
      priority_2,
      priority_3,
      other_todos,
      self_care_actions,
      productivity_reward,
      notes,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE daily_plans
       SET main_goal=$2,
           priority_1=$3,
           priority_2=$4,
           priority_3=$5,
           other_todos=$6,
           self_care_actions=$7,
           productivity_reward=$8,
           notes=$9
       WHERE id=$1
       RETURNING *`,
      [
        id,
        main_goal ?? null,
        priority_1 ?? null,
        priority_2 ?? null,
        priority_3 ?? null,
        other_todos ?? null,
        self_care_actions ?? null,
        productivity_reward ?? null,
        notes ?? null,
      ]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "dailyplan_update_failed" });
  }
});

// delete one daily plan
app.delete("/daily_plans/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM daily_plans WHERE id=$1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "dailyplan_delete_failed" });
  }
});

// create long-term vision
app.post("/long_term_visions", async (req, res) => {
  try {
    const { user_id, vision, clear_direction } = req.body;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const { rows } = await pool.query(
      `INSERT INTO long_term_visions (user_id, vision, clear_direction)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [user_id, vision ?? null, clear_direction ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ltv_create_failed" });
  }
});

// list long-term visions
app.get("/long_term_visions", async (req, res) => {
  try {
    const { user_id } = req.query;

    const q = user_id
      ? {
          text: "SELECT * FROM long_term_visions WHERE user_id=$1 ORDER BY created_at DESC",
          values: [user_id],
        }
      : {
          text: "SELECT * FROM long_term_visions ORDER BY created_at DESC",
          values: [],
        };

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ltv_list_failed" });
  }
});

// update one long-term vision
app.put("/long_term_visions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { vision, clear_direction } = req.body;

    const { rows } = await pool.query(
      `UPDATE long_term_visions
       SET vision=$2, clear_direction=$3
       WHERE id=$1
       RETURNING *`,
      [id, vision ?? null, clear_direction ?? null]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ltv_update_failed" });
  }
});

// delete one long-term vision
app.delete("/long_term_visions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM long_term_visions WHERE id=$1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ltv_delete_failed" });
  }
});


const port = process.env.PORT || 4000;

// bind to all interfaces so phone can reach it over Wi-Fi
app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${port}`);
  console.log('Try from phone browser:  http://192.168.1.23:4000/health');
});
