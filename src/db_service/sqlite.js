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
        // Tabela de Usuários
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TEXT DEFAULT (datetime('now'))
        )`);

        // Tabela de Veículos (com capacidade do tanque + placa Mercosul)
        db.run(`CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plate TEXT NOT NULL,
            model TEXT NOT NULL,
            brand TEXT NOT NULL,
            year INTEGER,
            fuel_type TEXT DEFAULT 'Flex',
            capacity REAL DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(user_id, plate)
        )`);

        // Tabela de Abastecimentos (com hodômetro e horímetro e tipo de combustível)
        db.run(`CREATE TABLE IF NOT EXISTS fuels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            vehicle_id INTEGER,
            vehicle TEXT,
            fuel_type TEXT DEFAULT 'Gasolina Comum',
            liters REAL DEFAULT 0,
            price_per_liter REAL DEFAULT 0,
            cost REAL NOT NULL,
            odometer REAL DEFAULT 0,
            horimeter REAL DEFAULT 0,
            date TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )`);

        // Tabela de Manutenções (com horímetro)
        db.run(`CREATE TABLE IF NOT EXISTS maintenances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            vehicle_id INTEGER,
            vehicle TEXT,
            service TEXT NOT NULL,
            cost REAL NOT NULL,
            horimeter REAL DEFAULT 0,
            date TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )`);

        // Tabela da Lixeira (Soft delete)
        db.run(`CREATE TABLE IF NOT EXISTS trash (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            original_id INTEGER,
            original_type TEXT,
            data TEXT,
            deleted_at TEXT DEFAULT (datetime('now'))
        )`);

        // Migrações: adicionar colunas novas a tabelas existentes (ignora erro se já existir)
        const migrations = [
            `ALTER TABLE vehicles ADD COLUMN user_id INTEGER DEFAULT 1`,
            `ALTER TABLE vehicles ADD COLUMN year INTEGER`,
            `ALTER TABLE vehicles ADD COLUMN fuel_type TEXT DEFAULT 'Flex'`,
            `ALTER TABLE vehicles ADD COLUMN capacity REAL DEFAULT 0`,
            `ALTER TABLE vehicles ADD COLUMN created_at TEXT DEFAULT (datetime('now'))`,
            `ALTER TABLE fuels ADD COLUMN user_id INTEGER DEFAULT 1`,
            `ALTER TABLE fuels ADD COLUMN fuel_type TEXT DEFAULT 'Gasolina Comum'`,
            `ALTER TABLE fuels ADD COLUMN liters REAL DEFAULT 0`,
            `ALTER TABLE fuels ADD COLUMN price_per_liter REAL DEFAULT 0`,
            `ALTER TABLE fuels ADD COLUMN odometer REAL DEFAULT 0`,
            `ALTER TABLE fuels ADD COLUMN horimeter REAL DEFAULT 0`,
            `ALTER TABLE fuels ADD COLUMN created_at TEXT DEFAULT (datetime('now'))`,
            `ALTER TABLE maintenances ADD COLUMN user_id INTEGER DEFAULT 1`,
            `ALTER TABLE maintenances ADD COLUMN horimeter REAL DEFAULT 0`,
            `ALTER TABLE maintenances ADD COLUMN created_at TEXT DEFAULT (datetime('now'))`,
            `ALTER TABLE trash ADD COLUMN user_id INTEGER DEFAULT 1`,
        ];

        migrations.forEach(sql => {
            db.run(sql, (err) => {
                // Ignore "duplicate column" errors silently — expected on re-deploy
            });
        });
    });
}

module.exports = db;
