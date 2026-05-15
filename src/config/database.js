const { Pool } = require('pg');
require('dotenv').config();

/**
 * Singleton da conexão com o Banco de Dados.
 * Utiliza Pool do 'pg' para reuso de conexões de forma eficiente.
 */
class Database {
    constructor() {
        if (!Database.instance) {
            const config = process.env.DATABASE_URL 
                ? { connectionString: process.env.DATABASE_URL, ssl: true }
                : {
                    host: process.env.DB_HOST || 'localhost',
                    port: process.env.DB_PORT || 5432,
                    user: process.env.DB_USER || 'postgres',
                    password: process.env.DB_PASS,
                    database: process.env.DB_NAME || 'fuel_control_db',
                };
            this.pool = new Pool(config);

            this.pool.on('error', (err, client) => {
                console.error('Unexpected error on idle client', err);
                process.exit(-1);
            });

            Database.instance = this;
        }
        return Database.instance;
    }

    /**
     * Executa uma query parametrizada no banco de dados.
     * @param {string} text A instrução SQL
     * @param {Array} params Os parâmetros (ex: [1, 'nome'])
     * @returns {Promise} Resultado da consulta
     */
    async query(text, params) {
        const start = Date.now();
        const res = await this.pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
}

const dbInstance = new Database();
Object.freeze(dbInstance);

module.exports = dbInstance;
