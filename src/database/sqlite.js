const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conecta ao banco de dados SQLite (ou cria se não existir)
const dbPath = path.resolve(__dirname, 'nexusfleet.sqlite');
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
        // Tabela de Veículos
        db.run(`CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate TEXT UNIQUE NOT NULL,
            model TEXT NOT NULL,
            brand TEXT NOT NULL,
            status TEXT DEFAULT 'active'
        )`);

        // Tabela de Abastecimentos
        db.run(`CREATE TABLE IF NOT EXISTS fuels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT,
            vehicle TEXT,
            cost REAL NOT NULL,
            date TEXT NOT NULL
        )`);

        // Tabela de Manutenções
        db.run(`CREATE TABLE IF NOT EXISTS maintenances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT,
            vehicle TEXT,
            service TEXT NOT NULL,
            cost REAL NOT NULL,
            date TEXT NOT NULL
        )`);

        // Tabela da Lixeira (Soft delete)
        db.run(`CREATE TABLE IF NOT EXISTS trash (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_id INTEGER,
            original_type TEXT,
            data TEXT,
            deleted_at TEXT
        )`);
    });
}

module.exports = db;
