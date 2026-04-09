/**
 * Entidade de Autenticação e Usuário.
 */
class User {
    /**
     * @param {Object} user
     * @param {string} [user.id]
     * @param {string} user.name
     * @param {string} user.email
     * @param {string} [user.password_hash]
     * @param {string} [user.role]
     */
    constructor({ id, name, email, password_hash, role = 'admin' }) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password_hash = password_hash;
        this.role = role;
    }

    // Comportamentos e validações próprias da entidade poderiam ficar aqui (Ex: isValid())
}

module.exports = User;
