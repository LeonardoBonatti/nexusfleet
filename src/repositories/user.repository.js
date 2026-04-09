const BaseRepository = require('./base.repository');

/**
 * UserRepository
 * Responsável pela comunicação direta com a tabela 'users' no banco de dados.
 */
class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async findByEmail(email) {
        const result = await this.db.query(`SELECT * FROM ${this.tableName} WHERE email = $1`, [email]);
        return result.rows[0];
    }

    async create(userData) {
        const query = `
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at
        `;
        const params = [userData.name, userData.email, userData.password_hash, userData.role];
        const result = await this.db.query(query, params);
        return result.rows[0];
    }
}

// Exporta uma instância única (Singleton)
module.exports = new UserRepository();
