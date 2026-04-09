const db = require('../config/database');

/**
 * BaseRepository
 * Implementa os métodos padrões CRUD para reutilização em repositórios específicos.
 */
class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = db;
    }

    async findAll() {
        const result = await this.db.query(`SELECT * FROM ${this.tableName}`);
        return result.rows;
    }

    async findById(id) {
        const result = await this.db.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
        return result.rows[0];
    }

    async delete(id) {
        const result = await this.db.query(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`, [id]);
        return result.rows[0];
    }
}

module.exports = BaseRepository;
