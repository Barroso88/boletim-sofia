import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import multer from 'multer';
import fs from 'fs';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

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
      ALTER TABLE agenda ADD COLUMN IF NOT EXISTS notas TEXT;

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
      ALTER TABLE peso ADD COLUMN IF NOT EXISTS altura NUMERIC(5, 1);

      CREATE TABLE IF NOT EXISTS altura (
        id BIGINT PRIMARY KEY,
        data TEXT NOT NULL,
        altura NUMERIC(5, 1) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS configuracoes (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vacinas (
        id BIGINT PRIMARY KEY,
        nome TEXT NOT NULL,
        data_recomendada TEXT NOT NULL,
        tomada BOOLEAN DEFAULT FALSE,
        grupo TEXT NOT NULL,
        data_administrada TEXT
      );
      ALTER TABLE vacinas ADD COLUMN IF NOT EXISTS data_administrada TEXT;


      CREATE TABLE IF NOT EXISTS documentos (
        id BIGINT PRIMARY KEY,
        titulo TEXT NOT NULL,
        numero TEXT,
        type TEXT
      );
      ALTER TABLE documentos ADD COLUMN IF NOT EXISTS ordem INT DEFAULT 0;

      CREATE TABLE IF NOT EXISTS categorias_digitalizacoes (
        id BIGINT PRIMARY KEY,
        nome TEXT NOT NULL,
        ordem INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS documentos_digitalizados (
        id BIGINT PRIMARY KEY,
        categoria_id BIGINT NOT NULL,
        titulo TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS latas_leite (
        id BIGINT PRIMARY KEY,
        data_abertura TEXT NOT NULL,
        capacidade_ml INTEGER DEFAULT 5580,
        nome_formula TEXT
      );
      ALTER TABLE latas_leite ADD COLUMN IF NOT EXISTS hora_abertura TEXT;

      CREATE TABLE IF NOT EXISTS leite (
        id BIGINT PRIMARY KEY,
        data TEXT NOT NULL,
        hora TEXT NOT NULL,
        quantidade_ml INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fraldas (
        id BIGINT PRIMARY KEY,
        data TEXT NOT NULL,
        hora TEXT NOT NULL,
        tipo TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sonos (
        id BIGINT PRIMARY KEY,
        data TEXT NOT NULL,
        hora_inicio TEXT NOT NULL,
        hora_fim TEXT NOT NULL,
        duracao_minutos INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS perfil (
        id INT PRIMARY KEY DEFAULT 1,
        nome_completo TEXT,
        data_nascimento TEXT,
        morada TEXT,
        codigo_postal TEXT,
        cidade TEXT,
        nome_pai TEXT,
        nome_mae TEXT,
        local_nascimento TEXT,
        peso_nascimento TEXT,
        altura_nascimento TEXT,
        grupo_sanguineo TEXT,
        notas TEXT
      );
      
      ALTER TABLE perfil ADD COLUMN IF NOT EXISTS codigo_postal TEXT;
      ALTER TABLE perfil ADD COLUMN IF NOT EXISTS cidade TEXT;
      ALTER TABLE perfil ADD COLUMN IF NOT EXISTS data_provavel_parto TEXT;

      CREATE TABLE IF NOT EXISTS acessos (
        id BIGINT PRIMARY KEY,
        titulo TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL
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

// --- PERFIL ---
app.get('/api/perfil', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM perfil WHERE id = 1');
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/perfil', async (req, res) => {
  const {
    nome_completo, data_nascimento, data_provavel_parto, morada, codigo_postal, cidade, nome_pai, nome_mae,
    local_nascimento, peso_nascimento, altura_nascimento, grupo_sanguineo, notas
  } = req.body;
  try {
    await pool.query(
      `INSERT INTO perfil (id, nome_completo, data_nascimento, data_provavel_parto, morada, codigo_postal, cidade, nome_pai, nome_mae, local_nascimento, peso_nascimento, altura_nascimento, grupo_sanguineo, notas)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET 
         nome_completo = $1, data_nascimento = $2, data_provavel_parto = $3, morada = $4, codigo_postal = $5, cidade = $6, nome_pai = $7, nome_mae = $8,
         local_nascimento = $9, peso_nascimento = $10, altura_nascimento = $11, grupo_sanguineo = $12, notas = $13`,
      [nome_completo, data_nascimento, data_provavel_parto, morada, codigo_postal, cidade, nome_pai, nome_mae, local_nascimento, peso_nascimento, altura_nascimento, grupo_sanguineo, notas]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  const { id, titulo, data, tipo, notas } = req.body;
  try {
    await pool.query(
      'INSERT INTO agenda (id, titulo, data, tipo, notas) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET titulo = $2, data = $3, tipo = $4, notas = $5',
      [id || Date.now(), titulo, data, tipo, notas || '']
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

// --- ALTURA ---
app.get('/api/altura', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, data, altura::float FROM altura ORDER BY data ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/altura', async (req, res) => {
  const { id, data, altura } = req.body;
  try {
    await pool.query(
      'INSERT INTO altura (id, data, altura) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $2, altura = $3',
      [id || Date.now(), data, altura]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/altura/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM altura WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CONFIGURACOES ---
app.get('/api/configuracoes/:chave', async (req, res) => {
  try {
    const result = await pool.query('SELECT valor FROM configuracoes WHERE chave = $1', [req.params.chave]);
    if (result.rows.length > 0) {
      res.json({ valor: result.rows[0].valor });
    } else {
      res.json({ valor: null });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/configuracoes', async (req, res) => {
  const { chave, valor } = req.body;
  try {
    await pool.query(
      'INSERT INTO configuracoes (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO UPDATE SET valor = $2',
      [chave, valor]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- VACINAS ---
app.get('/api/vacinas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, data_recomendada AS "dataRecomendada", tomada, grupo, data_administrada AS "dataAdministrada" FROM vacinas ORDER BY id ASC');
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
          'INSERT INTO vacinas (id, nome, data_recomendada, tomada, grupo, data_administrada) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET tomada = $4, data_administrada = $6',
          [v.id, v.nome, v.dataRecomendada || v.data_recomendada, v.tomada, v.grupo, v.dataAdministrada || v.data_administrada || null]
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
  const { tomada, dataAdministrada } = req.body;
  try {
    await pool.query('UPDATE vacinas SET tomada = $1, data_administrada = $2 WHERE id = $3', [tomada, dataAdministrada || null, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCUMENTOS ---
app.get('/api/documentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documentos ORDER BY ordem ASC, id ASC');
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
      for (let i = 0; i < docsList.length; i++) {
        const d = docsList[i];
        const ordem = d.ordem !== undefined ? d.ordem : i;
        await client.query(
          'INSERT INTO documentos (id, titulo, numero, type, ordem) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET titulo = $2, numero = $3, type = $4, ordem = $5',
          [d.id, d.titulo, d.numero || '', d.type || 'custom', ordem]
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

function getNowLisbon() {
  const now = new Date();
  const data = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });
  const hora = now.toLocaleTimeString('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false });
  return { data, hora };
}

// --- LEITE ---
app.get('/api/leite', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leite ORDER BY data DESC, hora DESC, id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function parsePortugueseNumber(str) {
  if (str === undefined || str === null) return null;
  if (typeof str === 'number') return str;
  const s = String(str).toLowerCase().trim();

  // Se contiver dígitos numéricos
  const match = s.match(/\d+/);
  if (match) return parseInt(match[0], 10);

  // Números compostos e por extenso
  if (s.includes('duzentos')) return 200;
  if (s.includes('cento e noventa')) return 190;
  if (s.includes('cento e oitenta')) return 180;
  if (s.includes('cento e setenta')) return 170;
  if (s.includes('cento e sessenta')) return 160;
  if (s.includes('cento e cinquenta')) return 150;
  if (s.includes('cento e quarenta')) return 140;
  if (s.includes('cento e trinta')) return 130;
  if (s.includes('cento e vinte')) return 120;
  if (s.includes('cento e dez')) return 110;
  if (s.includes('cento e cinco')) return 105;
  if (s.includes('cento')) return 100;

  // "sem" ou "cem" (o microfone do assistente confunde quase sempre "100" com a preposição "sem")
  if (s.includes('sem') || s.includes('cem')) return 100;

  if (s.includes('noventa')) return 90;
  if (s.includes('oitenta')) return 80;
  if (s.includes('setenta')) return 70;
  if (s.includes('sessenta')) return 60;
  if (s.includes('cinquenta')) return 50;
  if (s.includes('quarenta')) return 40;
  if (s.includes('trinta')) return 30;
  if (s.includes('vinte')) return 20;
  if (s.includes('dez')) return 10;

  const parsed = parseInt(s, 10);
  return isNaN(parsed) ? null : parsed;
}

const handleSaveLeite = async (req, res) => {
  let { id, data, hora, quantidade_ml, quantidade, ml, valor } = req.body || {};

  // Se parâmetros vierem via query string (GET ou POST com query)
  if (quantidade_ml === undefined && req.query) {
    quantidade_ml = req.query.quantidade_ml || req.query.quantidade || req.query.ml || req.query.valor;
  }
  if (!data && req.query && req.query.data) data = req.query.data;
  if (!hora && req.query && req.query.hora) hora = req.query.hora;

  // Extrair quantidade
  let rawQty = quantidade_ml !== undefined ? quantidade_ml : (quantidade !== undefined ? quantidade : (ml !== undefined ? ml : valor));
  let qty = parsePortugueseNumber(rawQty);

  if (!qty || isNaN(qty)) {
    return res.status(400).json({ error: 'Quantidade de leite em ml é obrigatória. Ex: {"quantidade_ml": 150}' });
  }

  const { data: currentData, hora: currentHora } = getNowLisbon();
  const recordId = id || Date.now();
  const recordData = data || currentData;
  const recordHora = hora || currentHora;

  try {
    await pool.query(
      'INSERT INTO leite (id, data, hora, quantidade_ml) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $2, hora = $3, quantidade_ml = $4',
      [recordId, recordData, recordHora, qty]
    );
    res.json({ success: true, id: recordId, data: recordData, hora: recordHora, quantidade_ml: qty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/leite', handleSaveLeite);
app.get('/api/leite/registar', handleSaveLeite);
app.all('/api/webhook/leite', handleSaveLeite);

app.delete('/api/leite/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM leite WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FRALDAS ---
app.get('/api/fraldas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fraldas ORDER BY data DESC, hora DESC, id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const handleSaveFralda = async (req, res) => {
  let { id, data, hora, tipo } = req.body || {};
  if (!tipo && req.query && req.query.tipo) {
    tipo = req.query.tipo;
  }
  
  // Normalizar tipos vindos do Home Assistant ou minúsculas
  if (tipo) {
    const t = tipo.toLowerCase().trim();
    if ((t.includes('xixi') && (t.includes('cocó') || t.includes('coco'))) || t === 'ambos' || t === 'tudo') {
      tipo = 'Cocó + Xixi';
    } else if (t.includes('cocó') || t.includes('coco')) {
      tipo = 'Cocó';
    } else if (t.includes('xixi')) {
      tipo = 'Xixi';
    } else {
      tipo = 'Xixi';
    }
  } else {
    tipo = 'Xixi';
  }

  const { data: currentData, hora: currentHora } = getNowLisbon();
  const recordId = id || Date.now();
  const recordData = data || currentData;
  const recordHora = hora || currentHora;

  try {
    await pool.query(
      'INSERT INTO fraldas (id, data, hora, tipo) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $2, hora = $3, tipo = $4',
      [recordId, recordData, recordHora, tipo]
    );
    res.json({ success: true, id: recordId, data: recordData, hora: recordHora, tipo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/fraldas', handleSaveFralda);
app.get('/api/fraldas/registar', handleSaveFralda);
app.all('/api/webhook/fraldas', handleSaveFralda);

app.delete('/api/fraldas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM fraldas WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SONOS ---
app.get('/api/sonos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sonos ORDER BY data DESC, hora_inicio DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const handleDormir = async (req, res) => {
  const { data: currentData, hora: currentHora } = getNowLisbon();
  let { hora_inicio, data } = req.body || {};
  if (!hora_inicio && req.query && req.query.hora_inicio) hora_inicio = req.query.hora_inicio;
  if (!data && req.query && req.query.data) data = req.query.data;

  hora_inicio = hora_inicio || currentHora;
  data = data || currentData;

  try {
    const sonosRes = await pool.query("SELECT * FROM sonos WHERE hora_fim = '' OR hora_fim IS NULL ORDER BY data DESC, hora_inicio DESC LIMIT 1");
    if (sonosRes.rows.length > 0) {
      const sonoAtual = sonosRes.rows[0];
      return res.json({
        success: true,
        already_sleeping: true,
        id: sonoAtual.id,
        hora_inicio: sonoAtual.hora_inicio,
        frase: `A Sofia já está a dormir desde as ${sonoAtual.hora_inicio}.`
      });
    }

    const recordId = Date.now();
    await pool.query(
      'INSERT INTO sonos (id, data, hora_inicio, hora_fim, duracao_minutos) VALUES ($1, $2, $3, $4, $5)',
      [recordId, data, hora_inicio, '', 0]
    );

    res.json({
      success: true,
      id: recordId,
      data,
      hora_inicio,
      frase: `Registei que a Sofia adormeceu às ${hora_inicio}. Bons sonhos!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handleAcordou = async (req, res) => {
  const { data: currentData, hora: currentHora } = getNowLisbon();
  let { hora_fim } = req.body || {};
  if (!hora_fim && req.query && req.query.hora_fim) hora_fim = req.query.hora_fim;
  hora_fim = hora_fim || currentHora;

  try {
    const sonosRes = await pool.query("SELECT * FROM sonos WHERE hora_fim = '' OR hora_fim IS NULL ORDER BY data DESC, hora_inicio DESC LIMIT 1");
    if (sonosRes.rows.length === 0) {
      return res.json({
        success: false,
        no_active_sleep: true,
        frase: 'Não havia nenhum sono em curso registado para a Sofia.'
      });
    }

    const sono = sonosRes.rows[0];
    const [hI, mI] = sono.hora_inicio.split(':').map(Number);
    const [hF, mF] = hora_fim.split(':').map(Number);
    let duracao = (hF * 60 + mF) - (hI * 60 + mI);
    if (duracao < 0) {
      duracao += 24 * 60; // Passou da meia-noite
    }

    await pool.query(
      'UPDATE sonos SET hora_fim = $1, duracao_minutos = $2 WHERE id = $3',
      [hora_fim, duracao, sono.id]
    );

    const duracaoFormatada = formatMinutosRelativos(duracao);
    res.json({
      success: true,
      id: sono.id,
      hora_inicio: sono.hora_inicio,
      hora_fim,
      duracao_minutos: duracao,
      frase: `A Sofia acordou às ${hora_fim}, após dormir ${duracaoFormatada}.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/sonos/dormir', handleDormir);
app.get('/api/sonos/dormir', handleDormir);
app.all('/api/webhook/sono/dormir', handleDormir);

app.post('/api/sonos/acordou', handleAcordou);
app.get('/api/sonos/acordou', handleAcordou);
app.all('/api/webhook/sono/acordou', handleAcordou);

app.post('/api/sonos', async (req, res) => {
  let { id, data, hora_inicio, hora_fim, duracao_minutos, acao, estado } = req.body || {};
  const act = (acao || estado || '').toLowerCase();
  if (act === 'dormir' || act === 'adormeceu') {
    return handleDormir(req, res);
  }
  if (act === 'acordou') {
    return handleAcordou(req, res);
  }

  const { data: currentData, hora: currentHora } = getNowLisbon();
  hora_inicio = hora_inicio || currentHora;
  data = data || currentData;
  hora_fim = hora_fim || '';
  duracao_minutos = duracao_minutos !== undefined ? duracao_minutos : 0;

  try {
    await pool.query(
      'INSERT INTO sonos (id, data, hora_inicio, hora_fim, duracao_minutos) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data = $2, hora_inicio = $3, hora_fim = $4, duracao_minutos = $5',
      [id || Date.now(), data, hora_inicio, hora_fim, duracao_minutos]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sonos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sonos WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CATEGORIAS DIGITALIZACOES ---
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias_digitalizacoes ORDER BY ordem ASC, id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categorias', async (req, res) => {
  const { id, nome, ordem } = req.body;
  try {
    await pool.query(
      'INSERT INTO categorias_digitalizacoes (id, nome, ordem) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET nome = $2, ordem = $3',
      [id || Date.now(), nome, ordem || 0]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categorias/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categorias_digitalizacoes WHERE id = $1', [id]);
    await pool.query('DELETE FROM documentos_digitalizados WHERE categoria_id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCUMENTOS DIGITALIZADOS ---
app.get('/api/digitalizacoes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documentos_digitalizados ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/digitalizacoes', upload.single('file'), async (req, res) => {
  const { id, categoria_id, titulo, created_at } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
  }

  const filename = req.file.filename;
  const original_name = req.file.originalname;

  try {
    await pool.query(
      'INSERT INTO documentos_digitalizados (id, categoria_id, titulo, filename, original_name, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET titulo = $3',
      [id || Date.now(), categoria_id, titulo, filename, original_name, created_at || new Date().toISOString()]
    );
    res.json({ success: true, filename, original_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/digitalizacoes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const docResult = await pool.query('SELECT filename FROM documentos_digitalizados WHERE id = $1', [id]);
    if (docResult.rows.length > 0) {
      const filename = docResult.rows[0].filename;
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await pool.query('DELETE FROM documentos_digitalizados WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LATAS DE LEITE ---
app.get('/api/latas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM latas_leite ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/latas', async (req, res) => {
  const { id, data_abertura, hora_abertura, capacidade_ml, nome_formula } = req.body;
  try {
    await pool.query(
      'INSERT INTO latas_leite (id, data_abertura, hora_abertura, capacidade_ml, nome_formula) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data_abertura = $2, hora_abertura = $3, capacidade_ml = $4, nome_formula = $5',
      [id, data_abertura, hora_abertura || '', capacidade_ml || 5580, nome_formula || '']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/latas/:id', async (req, res) => {
  const { id } = req.params;
  const { data_abertura, hora_abertura, capacidade_ml, nome_formula } = req.body;
  try {
    await pool.query(
      'UPDATE latas_leite SET data_abertura = $1, hora_abertura = $2, capacidade_ml = $3, nome_formula = $4 WHERE id = $5',
      [data_abertura, hora_abertura || '', capacidade_ml || 5580, nome_formula || '', id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/latas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM latas_leite WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ACESSOS ---
app.get('/api/acessos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM acessos ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/acessos', async (req, res) => {
  const { id, titulo, username, password } = req.body;
  try {
    await pool.query(
      'INSERT INTO acessos (id, titulo, username, password) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET titulo = $2, username = $3, password = $4',
      [id || Date.now(), titulo, username || '', password || '']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/acessos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM acessos WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- HOME ASSISTANT PROXY ---
app.post('/api/ha/webhook/:id', async (req, res) => {
  const { id } = req.params;
  // Use variable from Unraid Docker container environment
  const haUrl = process.env.HA_URL || 'https://ha.barrosoportal.com';

  try {
    const response = await fetch(`${haUrl}/api/webhook/${id}`, {
      method: 'POST'
    });

    if (response.ok) {
      res.json({ success: true });
    } else {
      res.status(response.status).json({ error: 'Erro ao contactar Home Assistant' });
    }
  } catch (err) {
    console.error('Erro no proxy para Home Assistant:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- HOME ASSISTANT STATUS ENDPOINT (VOZ / ASSIST / SENSORES) ---
function formatMinutosRelativos(totalMinutos) {
  if (totalMinutos <= 0) return 'menos de um minuto';
  if (totalMinutos === 1) return '1 minuto';
  if (totalMinutos < 60) return `${totalMinutos} minutos`;
  const horas = Math.floor(totalMinutos / 60);
  const mins = totalMinutos % 60;
  if (mins === 0) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  return `${horas} ${horas === 1 ? 'hora' : 'horas'} e ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
}

function formatProximaData(targetDate, nowLisbon) {
  const dTarget = targetDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });
  const dNow = nowLisbon.toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });

  const tomorrow = new Date(nowLisbon);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dTomorrow = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });

  const timeStr = targetDate.toLocaleTimeString('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false });
  const dayName = targetDate.toLocaleDateString('pt-PT', { timeZone: 'Europe/Lisbon', weekday: 'long', day: 'numeric', month: 'long' });

  if (dTarget === dNow) {
    return `hoje às ${timeStr}`;
  } else if (dTarget === dTomorrow) {
    return `amanhã, ${dayName} às ${timeStr}`;
  } else {
    return `${dayName} às ${timeStr}`;
  }
}

app.get('/api/ha/status', async (req, res) => {
  try {
    const now = new Date();
    const nowLisbon = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));

    // 1. Leite
    const leiteRes = await pool.query('SELECT * FROM leite ORDER BY data DESC, hora DESC, id DESC LIMIT 1');
    let ultimaMamada = null;
    if (leiteRes.rows.length > 0) {
      const row = leiteRes.rows[0];
      const past = new Date(`${row.data}T${row.hora}:00`);
      const diffMin = Math.max(0, Math.floor((nowLisbon - past) / (1000 * 60)));
      const tempo = formatMinutosRelativos(diffMin);
      ultimaMamada = {
        data: row.data,
        hora: row.hora,
        quantidade_ml: row.quantidade_ml,
        minutos_decorridos: diffMin,
        tempo_relativo: tempo,
        frase: `A Sofia mamou há ${tempo} (${row.quantidade_ml} ml às ${row.hora}).`
      };
    }

    // 1.1 Totais de Leite Hoje e Ontem
    const hojeStr = nowLisbon.toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });
    const ontemDate = new Date(nowLisbon);
    ontemDate.setDate(ontemDate.getDate() - 1);
    const ontemStr = ontemDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });

    const leiteHojeRes = await pool.query('SELECT COALESCE(SUM(quantidade_ml), 0) AS total_ml, COUNT(*) AS num_mamadas FROM leite WHERE data = $1', [hojeStr]);
    const leiteOntemRes = await pool.query('SELECT COALESCE(SUM(quantidade_ml), 0) AS total_ml, COUNT(*) AS num_mamadas FROM leite WHERE data = $1', [ontemStr]);

    const hojeMl = parseInt(leiteHojeRes.rows[0].total_ml, 10);
    const hojeCount = parseInt(leiteHojeRes.rows[0].num_mamadas, 10);
    const ontemMl = parseInt(leiteOntemRes.rows[0].total_ml, 10);
    const ontemCount = parseInt(leiteOntemRes.rows[0].num_mamadas, 10);

    const leiteHoje = {
      data: hojeStr,
      total_ml: hojeMl,
      num_mamadas: hojeCount,
      frase: hojeCount > 0
        ? `Hoje a Sofia já mamou ${hojeMl} ml, num total de ${hojeCount} ${hojeCount === 1 ? 'mamada' : 'mamadas'}.`
        : `Hoje a Sofia ainda não mamou.`
    };

    const leiteOntem = {
      data: ontemStr,
      total_ml: ontemMl,
      num_mamadas: ontemCount,
      frase: ontemCount > 0
        ? `Ontem a Sofia mamou um total de ${ontemMl} ml em ${ontemCount} ${ontemCount === 1 ? 'mamada' : 'mamadas'}.`
        : `Ontem a Sofia não tem registo de mamadas.`
    };

    // 2. Sono
    const sonosRes = await pool.query('SELECT * FROM sonos ORDER BY data DESC, hora_inicio DESC, id DESC LIMIT 10');
    let ultimoSono = null;
    if (sonosRes.rows.length > 0) {
      const sonoEmCurso = sonosRes.rows.find(s => !s.hora_fim);
      const row = sonoEmCurso || sonosRes.rows[0];
      const aDormir = !row.hora_fim;
      
      let refHora = aDormir ? row.hora_inicio : row.hora_fim;
      let past = new Date(`${row.data}T${refHora}:00`);
      if (!aDormir && row.hora_fim < row.hora_inicio) {
        past.setDate(past.getDate() + 1);
      }
      if (past > nowLisbon) {
        past.setDate(past.getDate() - 1);
      }

      const diffMin = Math.max(0, Math.floor((nowLisbon - past) / (1000 * 60)));
      const tempo = formatMinutosRelativos(diffMin);
      const duracao = formatMinutosRelativos(row.duracao_minutos);

      ultimoSono = {
        a_dormir: aDormir,
        hora_inicio: row.hora_inicio,
        hora_fim: row.hora_fim || null,
        duracao_minutos: row.duracao_minutos,
        minutos_decorridos: diffMin,
        tempo_relativo: tempo,
        frase: aDormir
          ? `A Sofia está a dormir há ${tempo}, adormeceu às ${row.hora_inicio}.`
          : `A Sofia está acordada há ${tempo}. Acordou às ${row.hora_fim} após dormir ${duracao}.`
      };
    }

    // 3. Fralda
    const fraldaRes = await pool.query('SELECT * FROM fraldas ORDER BY data DESC, hora DESC, id DESC LIMIT 1');
    let ultimaFralda = null;
    if (fraldaRes.rows.length > 0) {
      const row = fraldaRes.rows[0];
      let past = new Date(`${row.data}T${row.hora}:00`);
      if (past > nowLisbon) {
        past.setDate(past.getDate() - 1);
      }
      const diffMin = Math.max(0, Math.floor((nowLisbon - past) / (1000 * 60)));
      const tempo = formatMinutosRelativos(diffMin);
      ultimaFralda = {
        data: row.data,
        hora: row.hora,
        tipo: row.tipo,
        minutos_decorridos: diffMin,
        tempo_relativo: tempo,
        frase: `A última fralda da Sofia foi mudada há ${tempo} às ${row.hora} (${row.tipo}).`
      };
    }

    // 4. Próxima Consulta
    const agendaRes = await pool.query('SELECT * FROM agenda ORDER BY data ASC');
    let proximaConsulta = null;
    const consultasFuturas = agendaRes.rows.filter(ev => {
      const evDate = new Date(ev.data);
      const isFuture = evDate >= now;
      const t = (ev.tipo || '').toLowerCase();
      const isMedical = t !== 'mêsversário' && t !== 'aniversário' && t !== 'mesversario';
      return isFuture && isMedical;
    });

    if (consultasFuturas.length > 0) {
      const prox = consultasFuturas[0];
      const evDate = new Date(prox.data);
      const quandoFormatado = formatProximaData(evDate, nowLisbon);
      proximaConsulta = {
        titulo: prox.titulo,
        data_iso: prox.data,
        tipo: prox.tipo,
        notas: prox.notas || '',
        quando: quandoFormatado,
        frase: `A próxima consulta da Sofia é ${prox.titulo}, ${quandoFormatado}.`
      };
    } else {
      proximaConsulta = {
        titulo: null,
        frase: 'A Sofia não tem nenhuma consulta marcada na agenda para os próximos tempos.'
      };
    }

    // 5. Próxima Vacina
    const vacinasRes = await pool.query('SELECT * FROM vacinas WHERE tomada = FALSE ORDER BY id ASC');
    let proximaVacina = null;
    if (vacinasRes.rows.length > 0) {
      const v = vacinasRes.rows[0];
      proximaVacina = {
        nome: v.nome,
        grupo: v.grupo,
        dataRecomendada: v.data_recomendada,
        frase: `A próxima vacina recomendada para a Sofia é ${v.nome} (${v.grupo}), recomendada para ${v.data_recomendada}.`
      };
    } else {
      proximaVacina = {
        nome: null,
        frase: 'A Sofia tem todas as vacinas em dia.'
      };
    }

    res.json({
      status: 'OK',
      timestamp: now.toISOString(),
      ultima_mamada: ultimaMamada,
      leite_hoje: leiteHoje,
      leite_ontem: leiteOntem,
      ultimo_sono: ultimoSono,
      ultima_fralda: ultimaFralda,
      proxima_consulta: proximaConsulta,
      proxima_vacina: proximaVacina
    });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Boletim da Sofia server running on http://0.0.0.0:${PORT}`);
});
