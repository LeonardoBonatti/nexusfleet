const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database', 'nexusfleet.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('📦 Conectado ao banco de dados SQLite com sucesso.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Tabela de Usuários (autenticação real)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TEXT DEFAULT (datetime('now'))
        )`);

        // Função auxiliar para adicionar coluna se não existir
        const addColumnIfMissing = (table, column, type) => {
            db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    // Ignora erro de coluna duplicada, mas loga outros
                    if (!err.message.includes('duplicate column name')) {
                        // console.log(`Nota: Coluna ${column} já existe em ${table} ou erro ignorado.`);
                    }
                }
            });
        };

        // Tabela de Veículos - isolada por user_id
        db.run(`CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            plate TEXT NOT NULL,
            model TEXT NOT NULL,
            brand TEXT NOT NULL,
            status TEXT DEFAULT 'active'
        )`, () => {
            addColumnIfMissing('vehicles', 'user_id', 'INTEGER');
        });

        // Tabela de Abastecimentos - isolada por user_id
        db.run(`CREATE TABLE IF NOT EXISTS fuels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            vehicle_id TEXT,
            vehicle TEXT,
            cost REAL NOT NULL,
            date TEXT NOT NULL
        )`, () => {
            addColumnIfMissing('fuels', 'user_id', 'INTEGER');
        });

        // Tabela de Manutenções - isolada por user_id
        db.run(`CREATE TABLE IF NOT EXISTS maintenances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            vehicle_id TEXT,
            vehicle TEXT,
            service TEXT NOT NULL,
            cost REAL NOT NULL,
            date TEXT NOT NULL
        )`, () => {
            addColumnIfMissing('maintenances', 'user_id', 'INTEGER');
        });

        // Tabela da Lixeira - isolada por user_id
        db.run(`CREATE TABLE IF NOT EXISTS trash (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            original_id INTEGER,
            original_type TEXT,
            data TEXT,
            deleted_at TEXT
        )`, () => {
            addColumnIfMissing('trash', 'user_id', 'INTEGER');
        });
    });
}

module.exports = db;
