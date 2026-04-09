const jwt = require('jsonwebtoken');

/**
 * Middleware para validar a presença e expiração do Token JWT.
 */
module.exports = (req, res, next) => {
    // Busca o token do header de Authorizaton: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido ou Header não autorizado.' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Erro de formatação do Token.' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token mal formatado.' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }

        // Armazena no `req.userId` para que a próxima função saiba quem chamou
        req.userId = decoded.id;
        req.userRole = decoded.role;
        return next();
    });
};
