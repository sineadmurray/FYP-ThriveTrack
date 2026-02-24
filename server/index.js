import 'dotenv/config'; // Loads environment variables from .env into process.env
import express from 'express'; // Import the main server framework
import cors from 'cors'; // CORS allows mobile app to connect to your API from a different origin
import pkg from 'pg'; // PostgreSQL client library
import morgan from 'morgan'; // HTTP request logger (shows GET, POST, etc. in the terminal)
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


const { Pool } = pkg; // Extract the Pool class (used for database connections)

const app = express(); // Create an Express application instance

// Supabase server client (verifies JWTs from the mobile app)
const supabaseServer = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) return res.status(401).json({ error: "missing_token" });

    const { data, error } = await supabaseServer.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "invalid_token" });
    }

    req.userId = data.user.id;
    next();
  } catch (e) {
    console.error("requireAuth error:", e);
    return res.status(401).json({ error: "unauthorized" });
  }
}

// CORS + JSON
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] })); // Allow all origins (mobile phone, Expo tunnel, web etc.)
app.use(express.json()); // Parse incoming JSON in request bodies
app.use(morgan('dev')); // Log every request in the terminal (useful for debugging)

console.log("DATABASE_URL =", process.env.DATABASE_URL); // Log the connection string for debugging purposes
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://sineadmurray@localhost:5432/thrivetrack",
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// health
// Used to confirm the API and database are online.
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    console.error("HEALTH CHECK DB ERROR:", e);
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
        mood_value INT NOT NULL,  
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
app.post("/mood_entries", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { mood, mood_value, notes } = req.body;

    if (!mood || !mood_value) {
      return res.status(400).json({ error: "mood and mood_value are required" });
    }
    if (mood_value < 1 || mood_value > 5) {
      return res.status(400).json({ error: "mood_value must be between 1 and 5" });
    }

    const { rows } = await pool.query(
      `INSERT INTO mood_entries (user_id, mood, mood_value, notes)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [userId, mood, mood_value, notes ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "create_failed" });
  }
});

// list mood entries
app.get("/mood_entries", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM mood_entries WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "list_failed" });
  }
});

// update one mood entry
app.put("/mood_entries/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { mood, mood_value, notes } = req.body;

    if (!mood || !mood_value) {
      return res.status(400).json({ error: "mood and mood_value are required" });
    }
    if (mood_value < 1 || mood_value > 5) {
      return res.status(400).json({ error: "mood_value must be between 1 and 5" });
    }

    const { rows } = await pool.query(
      `UPDATE mood_entries
       SET mood=$3, mood_value=$4, notes=$5
       WHERE id=$1 AND user_id=$2
       RETURNING *`,
      [id, userId, mood, mood_value, notes ?? null]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "update_failed" });
  }
});


// delete one mood entry
app.delete("/mood_entries/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM mood_entries WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "delete_failed" });
  }
});

// create end-of-day reflection
app.post("/end_of_day_reflections", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { went_well, learned, proud_of, self_care } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO end_of_day_reflections
       (user_id, went_well, learned, proud_of, self_care)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [userId, went_well ?? null, learned ?? null, proud_of ?? null, self_care ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "eod_create_failed" });
  }
});

// list end-of-day reflections
app.get("/end_of_day_reflections", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM end_of_day_reflections WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "eod_list_failed" });
  }
});

// update one end-of-day reflection
app.put("/end_of_day_reflections/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { went_well, learned, proud_of, self_care } = req.body;

    const { rows } = await pool.query(
      `UPDATE end_of_day_reflections
       SET went_well=$3, learned=$4, proud_of=$5, self_care=$6
       WHERE id=$1 AND user_id=$2
       RETURNING *`,
      [id, userId, went_well ?? null, learned ?? null, proud_of ?? null, self_care ?? null]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "eod_update_failed" });
  }
});

// delete one end-of-day reflection
app.delete("/end_of_day_reflections/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM end_of_day_reflections WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "eod_delete_failed" });
  }
});


// create trap & track entry
app.post("/trap_and_track", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
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
      `INSERT INTO trap_and_track
       (user_id, circumstance, trigger, response, avoidance, consequence, copingstrategy, tryalternative, consequenceafter)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        userId,
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
    res.status(500).json({ error: "tt_create_failed" });
  }
});


// list trap & track entries 
app.get("/trap_and_track", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM trap_and_track WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "tt_list_failed" });
  }
});


// update one trap & track entry
app.put("/trap_and_track/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
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
       SET circumstance=$3,
           trigger=$4,
           response=$5,
           avoidance=$6,
           consequence=$7,
           copingstrategy=$8,
           tryalternative=$9,
           consequenceafter=$10
       WHERE id=$1 AND user_id=$2
       RETURNING *`,
      [
        id,
        userId,
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

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "tt_update_failed" });
  }
});

// delete one trap & track entry
app.delete("/trap_and_track/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM trap_and_track WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "tt_delete_failed" });
  }
});

// create gratitude entry
app.post("/gratitude_entries", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    const { rows } = await pool.query(
      "INSERT INTO gratitude_entries (user_id, text) VALUES ($1,$2) RETURNING *",
      [userId, text.trim()]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gratitude_create_failed" });
  }
});


// list gratitude entries
app.get("/gratitude_entries", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM gratitude_entries WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gratitude_list_failed" });
  }
});

// update one gratitude entry
app.put("/gratitude_entries/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ error: "text is required" });

    const { rows } = await pool.query(
      "UPDATE gratitude_entries SET text=$3 WHERE id=$1 AND user_id=$2 RETURNING *",
      [id, userId, text.trim()]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "gratitude_update_failed" });
  }
});

// delete one gratitude entry
app.delete("/gratitude_entries/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM gratitude_entries WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

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
app.post("/outside_in_actions", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt_id, action_text } = req.body;

    if (!prompt_id || !action_text || !action_text.trim()) {
      return res.status(400).json({ error: "prompt_id and action_text are required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO outside_in_actions (user_id, prompt_id, action_text)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [userId, prompt_id, action_text.trim()]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_action_create_failed" });
  }
});

// list outside-in actions
app.get("/outside_in_actions", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM outside_in_actions WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_action_list_failed" });
  }
});

// update one outside-in action
app.put("/outside_in_actions/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { action_text } = req.body;

    if (!action_text || !action_text.trim()) {
      return res.status(400).json({ error: "action_text is required" });
    }

    const { rows } = await pool.query(
      `UPDATE outside_in_actions
       SET action_text=$3
       WHERE id=$1 AND user_id=$2
       RETURNING *`,
      [id, userId, action_text.trim()]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_action_update_failed" });
  }
});

// delete one outside-in action
app.delete("/outside_in_actions/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM outside_in_actions WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "outside_in_action_delete_failed" });
  }
});


// create where-i-am reflection
app.post("/where_i_am_reflections", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      mind_now,
      mind_want,
      body_now,
      body_want,
      career_now,
      career_want,
      relationships_now,
      relationships_want,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO where_i_am_reflections
       (user_id, mind_now, mind_want, body_now, body_want, career_now, career_want, relationships_now, relationships_want)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        userId,
        mind_now ?? null,
        mind_want ?? null,
        body_now ?? null,
        body_want ?? null,
        career_now ?? null,
        career_want ?? null,
        relationships_now ?? null,
        relationships_want ?? null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "whereiam_create_failed" });
  }
});

// list where-i-am reflections
app.get("/where_i_am_reflections", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM where_i_am_reflections WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "whereiam_list_failed" });
  }
});

// update one where-i-am reflection
app.put("/where_i_am_reflections/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const {
      mind_now,
      mind_want,
      body_now,
      body_want,
      career_now,
      career_want,
      relationships_now,
      relationships_want,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE where_i_am_reflections
       SET mind_now=$3, mind_want=$4,
           body_now=$5, body_want=$6,
           career_now=$7, career_want=$8,
           relationships_now=$9, relationships_want=$10
       WHERE id=$1 AND user_id=$2
       RETURNING *`,
      [
        id,
        userId,
        mind_now ?? null,
        mind_want ?? null,
        body_now ?? null,
        body_want ?? null,
        career_now ?? null,
        career_want ?? null,
        relationships_now ?? null,
        relationships_want ?? null,
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
app.delete("/where_i_am_reflections/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM where_i_am_reflections WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "whereiam_delete_failed" });
  }
});

// create weekly reflection
app.post("/weekly_reflections", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      mind,
      body,
      career,
      relationships,
      held_me_back,
      lesson_learned,
      next_weeks_focus,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO weekly_reflections
       (user_id, mind, body, career, relationships, held_me_back, lesson_learned, next_weeks_focus)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        userId,
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
app.get("/weekly_reflections", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM weekly_reflections WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "weekly_list_failed" });
  }
});


// update one weekly reflection
app.put("/weekly_reflections/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      mind,
      body,
      career,
      relationships,
      held_me_back,
      lesson_learned,
      next_weeks_focus,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE weekly_reflections
       SET mind=$3, body=$4, career=$5, relationships=$6,
           held_me_back=$7, lesson_learned=$8, next_weeks_focus=$9
       WHERE id=$1 AND user_id=$2
       RETURNING *`,
      [
        id,
        userId,
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
app.delete("/weekly_reflections/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM weekly_reflections WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "weekly_delete_failed" });
  }
});

// create daily plan
app.post("/daily_plans", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
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
      `INSERT INTO daily_plans
       (user_id, main_goal, priority_1, priority_2, priority_3, other_todos, self_care_actions, productivity_reward, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        userId,
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
app.get("/daily_plans", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM daily_plans WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "dailyplan_list_failed" });
  }
});

// update one daily plan
app.put("/daily_plans/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
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
       SET main_goal=$3,
           priority_1=$4,
           priority_2=$5,
           priority_3=$6,
           other_todos=$7,
           self_care_actions=$8,
           productivity_reward=$9,
           notes=$10
       WHERE id=$1 AND user_id=$2
       RETURNING *`,
      [
        id,
        userId,
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
app.delete("/daily_plans/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM daily_plans WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "dailyplan_delete_failed" });
  }
});


// create long-term vision
app.post("/long_term_visions", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { vision, clear_direction } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO long_term_visions (user_id, vision, clear_direction)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [userId, vision ?? null, clear_direction ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ltv_create_failed" });
  }
});

// list long-term visions
app.get("/long_term_visions", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { rows } = await pool.query(
      "SELECT * FROM long_term_visions WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ltv_list_failed" });
  }
});

// update one long-term vision
app.put("/long_term_visions/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { vision, clear_direction } = req.body;

    const { rows } = await pool.query(
      `UPDATE long_term_visions
       SET vision=$3, clear_direction=$4
       WHERE id=$1 AND user_id=$2
       RETURNING *`,
      [id, userId, vision ?? null, clear_direction ?? null]
    );

    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ltv_update_failed" });
  }
});

// delete one long-term vision
app.delete("/long_term_visions/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM long_term_visions WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ltv_delete_failed" });
  }
});

// WEEKLY SUMMARY (last 7 days)
// Returns counts for Mood Logs, Reflect Entries, and Grow Entries (grouped).
app.get("/weekly_summary", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const since = "NOW() - INTERVAL '7 days'";

    // Mood logs = mood_entries
    const moodCountResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM mood_entries
       WHERE user_id = $1 AND created_at >= ${since}`,
      [userId]
    );

    // Reflect entries (Reflect section)
    // This includes: end_of_day_reflections, gratitude_entries, trap_and_track, outside_in_actions
    const reflectCountResult = await pool.query(
      `SELECT (
          (SELECT COUNT(*) FROM end_of_day_reflections WHERE user_id=$1 AND created_at >= ${since}) +
          (SELECT COUNT(*) FROM gratitude_entries       WHERE user_id=$1 AND created_at >= ${since}) +
          (SELECT COUNT(*) FROM trap_and_track          WHERE user_id=$1 AND created_at >= ${since}) +
          (SELECT COUNT(*) FROM outside_in_actions      WHERE user_id=$1 AND created_at >= ${since})
        )::int AS count`,
      [userId]
    );

    // Grow entries (Grow section)
    // This includes: daily_plans, long_term_visions, where_i_am_reflections, weekly_reflections
    const growCountResult = await pool.query(
      `SELECT (
          (SELECT COUNT(*) FROM daily_plans            WHERE user_id=$1 AND created_at >= ${since}) +
          (SELECT COUNT(*) FROM long_term_visions      WHERE user_id=$1 AND created_at >= ${since}) +
          (SELECT COUNT(*) FROM where_i_am_reflections WHERE user_id=$1 AND created_at >= ${since}) +
          (SELECT COUNT(*) FROM weekly_reflections     WHERE user_id=$1 AND created_at >= ${since})
        )::int AS count`,
      [userId]
    );

    res.json({
      moodCount: moodCountResult.rows[0].count,
      reflectCount: reflectCountResult.rows[0].count,
      growCount: growCountResult.rows[0].count,
    });
  } catch (e) {
    console.error("weekly_summary error:", e);
    res.status(500).json({ error: "weekly_summary_failed" });
  }
});

//** code sourced from chatgpt conversation **// 
//....//
app.post("/weekly_summary_ai", requireAuth, async (req, res) => {
  try {
      const userId = req.userId;

    // 1) Pull last 7 days of *actual content* from the DB
    // Keep this minimal to reduce tokens + protect privacy.
    const since = "NOW() - INTERVAL '7 days'";

    const moods = await pool.query(
      `SELECT mood, mood_value, notes, created_at
       FROM mood_entries
       WHERE user_id=$1 AND created_at >= ${since}
       ORDER BY created_at ASC`,
      [userId]
    );

    const eod = await pool.query(
      `SELECT went_well, learned, proud_of, self_care, created_at
       FROM end_of_day_reflections
       WHERE user_id=$1 AND created_at >= ${since}
       ORDER BY created_at ASC`,
      [userId]
    );

    const gratitude = await pool.query(
      `SELECT text, created_at
       FROM gratitude_entries
       WHERE user_id=$1 AND created_at >= ${since}
       ORDER BY created_at ASC`,
      [userId]
    );

    const outsideIn = await pool.query(
      `SELECT action_text, created_at
      FROM outside_in_actions
      WHERE user_id=$1 AND created_at >= ${since}
      ORDER BY created_at ASC`,
      [userId]
    );

    const plans = await pool.query(
      `SELECT main_goal, priority_1, priority_2, priority_3, self_care_actions, productivity_reward, notes, created_at
      FROM daily_plans
      WHERE user_id=$1 AND created_at >= ${since}
      ORDER BY created_at ASC`,
      [userId]
    );

    const growWeekly = await pool.query(
      `SELECT mind, body, career, relationships, held_me_back, lesson_learned, next_weeks_focus, created_at
       FROM weekly_reflections
       WHERE user_id=$1 AND created_at >= ${since}
       ORDER BY created_at ASC`,
      [userId]
    );

    // Combine into one payload for the model
      const weeklyData = {
        moods: moods.rows,
        dailyReflection: eod.rows,           
        gratitude: gratitude.rows,
        outsideInActions: outsideIn.rows,    
        dailyPlans: plans.rows,              
        weeklyReflections: growWeekly.rows,  
      };


    // 2) Define a strict output shape (so your RN UI can render bullet lists reliably)
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        overallMoodTrend: { type: "string" },
        whatFeltPositive: { type: "string" },
        whatFeltChallenging: { type: "string" },
        gentleSuggestion: { type: "string" },
        note: { type: "string" },
      },
      required: [
        "overallMoodTrend",
        "whatFeltPositive",
        "whatFeltChallenging",
        "gentleSuggestion",
        "note",
      ],
    };

    // 3) Call OpenAI (Responses API) to generate the weekly summary
        const instructions = `
        You are a supportive wellbeing reflection assistant for university students.

        Write in a warm, encouraging, emotionally intelligent tone.

        Create a weekly reflection summary ONLY from:
        - mood entries
        - daily reflections / positive thoughts
        - outside-in actions
        - gratitude entries
        - daily plans
        - weekly reflection & review

        Do NOT reference Trap & Track, Where-I-Am reflections, or Long-Term Vision.

        Guidelines:
        - Identify patterns and trends across the week (not a list of entries).
        - Interpret emotional trends (improving, fluctuating, steady, mixed).
        - Highlight meaningful patterns and coping attempts.
        - Acknowledge effort and resilience.
        - Normalise challenges without minimising them.
        - Avoid clinical language or diagnoses.
        - Write 3–5 sentences per section.
        - Do NOT repeat raw entry wording.
        - Do NOT list data.

        If self-harm intent appears, gently encourage seeking support.
        `;

    const ai = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Create a weekly wellbeing summary from the following last-7-days data (JSON):\n\n" +
                JSON.stringify(weeklyData),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "weekly_summary",
          schema,
          strict: true,
        },
      },
      max_output_tokens: 350,
    });

    // 4) Convert the model output into a JS object
    const summary = JSON.parse(ai.output_text);

    // 5) Send it back to the app
    res.json({ summary });
  } catch (e) {
    console.error("weekly_summary_ai error:", e);
    res.status(500).json({ error: "weekly_summary_ai_failed" });
  }
});
//....//
//** code sourced from chatgpt conversation **// 

// --- AI Reflection Assistant (simple, non-streaming) ---

const AI_MODEL = "gpt-4o-mini"; // good default for cost/latency

function buildSystemPrompt() {
  return `
You are ThriveTrack’s AI Reflection Assistant for university students.

Role:
- Calm, supportive conversational companion
- Reflective listening (“a diary that talks back”)
- Light wellbeing coach (subtly CBT-informed)

Do:
- Validate feelings and normalize stress in student life
- Ask 1–2 gentle follow-up questions
- Offer 1–3 small coping strategies (grounding, breathing, journaling prompts, planning a tiny next step)
- Encourage one small positive action the user can do today
- Use warm, human language and short paragraphs

Do NOT:
- Provide medical/clinical advice or instructions
- Diagnose conditions
- Claim you are a therapist or replace professional help

Safety:
- If the user indicates risk of self-harm, suicide, or immediate danger:
  * Encourage reaching out to local emergency services and crisis supports
  * Keep it short, supportive, and action-oriented
  * Do not provide detailed methods or plans
`.trim();
}

// VERY BASIC keyword detection (you can expand carefully)
function detectCrisis(text) {
  const t = (text || "").toLowerCase();

  // Phrases indicating possible self-harm / suicide ideation
  const patterns = [
    /\bkill myself\b/,
    /\bsuicide\b/,
    /\bend my life\b/,
    /\bwant to die\b/,
    /\bself[-\s]?harm\b/,
    /\bhurt myself\b/,
    /\bcan’t go on\b/,
    /\bno reason to live\b/,
  ];

  return patterns.some((re) => re.test(t));
}

function crisisResponse() {
  // Ireland-focused since your timezone is Dublin; still broadly usable.
  // Emergency numbers: 112 or 999 in Ireland. :contentReference[oaicite:2]{index=2}
  // Samaritans Ireland: 116 123, email jo@samaritans.ie :contentReference[oaicite:3]{index=3}
  // Pieta crisis helpline page (number shown there). :contentReference[oaicite:4]{index=4}
  return {
    reply: [
      "I’m really sorry you’re feeling this way. You don’t have to carry it alone.",
      "",
      "If you’re in immediate danger or might act on these feelings, please call **112 or 999** right now (Ireland) or your local emergency number.",
      "",
      "You can also reach out for free, confidential support:",
      "• **Samaritans (Ireland): 116 123** (24/7) or **jo@samaritans.ie**",
      "• **Pieta Crisis Helpline:** see Pieta’s 24/7 helpline options",
      "",
      "If you can, tell me: **are you safe right now**, and is there someone you can contact (a friend, family member, or your campus support service) to be with you?"
    ].join("\n"),
    flags: { crisis: true }
  };
}

app.post("/ai/reflection", requireAuth, async (req, res) => {
  try {
    const userId = req.userId; // available if you want to log minimal metadata
    const { text, messages } = req.body;

    // Accept either { text } or { messages }
    let convo = [];

    if (Array.isArray(messages) && messages.length > 0) {
      // sanitize + clamp
      convo = messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-12); // keep last N messages only
    } else if (typeof text === "string" && text.trim()) {
      convo = [{ role: "user", content: text.trim() }];
    } else {
      return res.status(400).json({ error: "invalid_input" });
    }

    const lastUserMsg = [...convo].reverse().find((m) => m.role === "user")?.content || "";
    if (lastUserMsg.length > 1500) {
      return res.status(400).json({ error: "message_too_long" });
    }

    // Crisis gate (don’t call the model)
    if (detectCrisis(lastUserMsg)) {
      return res.json(crisisResponse());
    }

    const instructions = buildSystemPrompt();

    // Responses API (recommended for new projects) :contentReference[oaicite:5]{index=5}
    const input = convo.map((m) => ({
      role: m.role,
      content: [{ type: "input_text", text: m.content }],
    }));

    const ai = await openai.responses.create({
      model: AI_MODEL,
      instructions,
      input,
      max_output_tokens: 300,
    });

    const reply = (ai.output_text || "").trim();
    if (!reply) {
      return res.status(502).json({ error: "empty_model_reply" });
    }

    res.json({
      reply,
      flags: { crisis: false },
    });
  } catch (e) {
    console.error("ai/reflection error:", e);
    res.status(500).json({ error: "ai_reflection_failed" });
  }
});


const port = process.env.PORT || 4000;

// bind to all interfaces so phone can reach it over Wi-Fi
app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${port}`);
  console.log('Try from phone browser:  http://192.168.1.23:4000/health');
});
