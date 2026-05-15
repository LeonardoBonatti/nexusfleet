const db = require('../sqlite');

/**
 * UserRepository
 * Responsável pela comunicação com a tabela 'users' usando SQLite.
 */
class UserRepository {
    // Busca um usuário pelo email
    findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    // Cria um novo usuário
    create(userData) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
                [userData.name, userData.email, userData.password_hash, userData.role || 'user'],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, name: userData.name, email: userData.email, role: userData.role });
                }
            );
        });
    }
}

module.exports = new UserRepository();
