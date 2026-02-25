import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar banco de dados para persistência real
const db = new Database('data.db');
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

const getGlobalState = () => {
  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get('global_state');
  if (row) return JSON.parse(row.value);
  return {
    producao: {},
    mensal: {},
    planReal: {},
    relatorio: {},
    paradas: {}
  };
};

const saveGlobalState = (state) => {
  db.prepare('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)').run('global_state', JSON.stringify(state));
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;
  let globalState = getGlobalState();

  io.on('connection', (socket) => {
    socket.emit('initial_state', globalState);

    const handleUpdate = (type, payload) => {
      const { date, month, data } = payload;
      const key = date || month;
      if (!globalState[type]) globalState[type] = {};
      globalState[type][key] = data;
      saveGlobalState(globalState);
      socket.broadcast.emit(`${type}_updated`, payload);
    };

    socket.on('update_producao', (payload) => handleUpdate('producao', payload));
    socket.on('update_mensal', (payload) => handleUpdate('mensal', payload));
    socket.on('update_planReal', (payload) => handleUpdate('planReal', payload));
    socket.on('update_relatorio', (payload) => handleUpdate('relatorio', payload));
    socket.on('update_paradas', (payload) => handleUpdate('paradas', payload));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Erro ao iniciar o servidor:', err);
});
