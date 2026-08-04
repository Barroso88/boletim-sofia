import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// PostgreSQL Pool Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'boletim_sofia',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 5000,
};

let pool = null;
let isDbConnected = false;
function initDbPool() {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  } else {
    pool = new Pool(dbConfig);
  }

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
    isDbConnected = false;
  });
}

// Ensure target database exists before connecting pool
async function ensureDatabaseExists() {
  let targetDb = process.env.DB_NAME || 'boletim_sofia';
  let rootConnectionString = null;

  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      const dbPath = parsedUrl.pathname.replace('/', '');
      if (dbPath) targetDb = dbPath;
      parsedUrl.pathname = '/postgres';
      rootConnectionString = parsedUrl.toString();
    } catch (e) {
      console.warn('Could not parse DATABASE_URL for DB auto-creation:', e.message);
    }
  }

  if (targetDb === 'postgres' || targetDb === 'template1') {
    return;
  }

  const rootConfig = rootConnectionString
    ? { connectionString: rootConnectionString, connectionTimeoutMillis: 5000 }
    : { ...dbConfig, database: 'postgres' };

  const rootPool = new Pool(rootConfig);
  try {
    const client = await rootPool.connect();
    const checkRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    if (checkRes.rows.length === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating database "${targetDb}"...`);
      const safeDbName = targetDb.replace(/[^a-zA-Z0-9_]/g, '');
      await client.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`Database "${safeDbName}" created successfully!`);
    }
    client.release();
  } catch (err) {
    console.warn(`Database check/creation warning (will attempt direct connection): ${err.message}`);
  } finally {
    await rootPool.end().catch(() => {});
  }
}

// Auto-create Tables
async function setupTables() {
  await ensureDatabaseExists();
  initDbPool();

  if (!pool) return;
  try {
    const client = await pool.connect();
    isDbConnected = true;
    console.log('Successfully connected to PostgreSQL database!');

    await client.query(`
      CREATE TABLE IF NOT EXISTS agenda (
        id BIGINT PRIMARY KEY,
        titulo TEXT NOT NULL,
        data TEXT NOT NULL,
        tipo TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS marcos (
        id BIGINT PRIMARY KEY,
        titulo TEXT NOT NULL,
        data TEXT NOT NULL,
        descricao TEXT,
        icone TEXT
      );

      CREATE TABLE IF NOT EXISTS peso (
        id BIGINT PRIMARY KEY,
        data TEXT NOT NULL,
        peso NUMERIC(6, 3) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vacinas (
        id BIGINT PRIMARY KEY,
        nome TEXT NOT NULL,
        data_recomendada TEXT NOT NULL,
        tomada BOOLEAN DEFAULT FALSE,
        grupo TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS documentos (
        id BIGINT PRIMARY KEY,
        titulo TEXT NOT NULL,
        numero TEXT,
        type TEXT
      );
    `);

    client.release();
  } catch (err) {
    isDbConnected = false;
    console.warn('PostgreSQL connection check failed. App will operate with in-memory / local fallback until DB is available:', err.message);
  }
}

setupTables();

// --- API ROUTES ---

// Healthcheck / DB Status
app.get('/api/health', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT NOW()');
      isDbConnected = true;
      return res.json({ status: 'ok', db: 'connected', time: result.rows[0].now });
    }
  } catch (err) {
    isDbConnected = false;
  }
  res.json({ status: 'ok', db: 'disconnected' });
});

// --- AGENDA ---
app.get('/api/agenda', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agenda ORDER BY data ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agenda', async (req, res) => {
  const { id, titulo, data, tipo } = req.body;
  try {
    await pool.query(
      'INSERT INTO agenda (id, titulo, data, tipo) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET titulo = $2, data = $3, tipo = $4',
      [id || Date.now(), titulo, data, tipo]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/agenda/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM agenda WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MARCOS ---
app.get('/api/marcos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marcos ORDER BY data ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/marcos', async (req, res) => {
  const { id, titulo, data, descricao, icone } = req.body;
  try {
    await pool.query(
      'INSERT INTO marcos (id, titulo, data, descricao, icone) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET titulo = $2, data = $3, descricao = $4, icone = $5',
      [id || Date.now(), titulo, data, descricao || '', icone || '🌟']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/marcos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM marcos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PESO ---
app.get('/api/peso', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, data, peso::float FROM peso ORDER BY data ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/peso', async (req, res) => {
  const { id, data, peso } = req.body;
  try {
    await pool.query(
      'INSERT INTO peso (id, data, peso) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $2, peso = $3',
      [id || Date.now(), data, peso]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/peso/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM peso WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- VACINAS ---
app.get('/api/vacinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, data_recomendada AS "dataRecomendada", tomada, grupo FROM vacinas ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vacinas/bulk', async (req, res) => {
  const vacinasList = req.body; // array
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const v of vacinasList) {
        await client.query(
          'INSERT INTO vacinas (id, nome, data_recomendada, tomada, grupo) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET tomada = $4',
          [v.id, v.nome, v.dataRecomendada || v.data_recomendada, v.tomada, v.grupo]
        );
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vacinas/:id', async (req, res) => {
  const { tomada } = req.body;
  try {
    await pool.query('UPDATE vacinas SET tomada = $1 WHERE id = $2', [tomada, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCUMENTOS ---
app.get('/api/documentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documentos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documentos/bulk', async (req, res) => {
  const docsList = req.body;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const d of docsList) {
        await client.query(
          'INSERT INTO documentos (id, titulo, numero, type) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET titulo = $2, numero = $3, type = $4',
          [d.id, d.titulo, d.numero || '', d.type || 'custom']
        );
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/documentos/:id', async (req, res) => {
  const { titulo, numero } = req.body;
  try {
    await pool.query('UPDATE documentos SET titulo = $1, numero = $2 WHERE id = $3', [titulo, numero, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documentos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM documentos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Static Frontend Files
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Boletim da Sofia server running on port ${PORT}`);
});
