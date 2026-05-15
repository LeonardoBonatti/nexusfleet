// UserController
const userService = require('../services/user.service');

/**
 * UserController
 * Recebe as requisições HTTP da rota de usuários, chama o Serviço correspondente e devolve a Resposta HTTP.
 */
class UserController {
    async register(req, res) {
        try {
            const { name, email, password, role } = req.body;
            
            // Simples validação de entrada
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Nome, Email e Senha são obrigatórios.' });
            }

            const newUser = await userService.registerUser({ name, email, password, role });
            return res.status(201).json({
                success: true,
                message: 'Usuário registrado com sucesso!',
                data: newUser
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ error: error.message || 'Erro interno no servidor.' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email e Senha são obrigatórios.' });
            }

            const authData = await userService.login(email, password);
            return res.status(200).json({
                success: true,
                message: 'Login bem sucedido.',
                data: authData
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ error: error.message || 'Erro interno no servidor.' });
        }
    }

    // Exemplo de uma rota protegida onde pegamos o req.userId do Middleware
    async getProfile(req, res) {
        try {
            // O ideal seria que o service buscasse pelo ID inteiro, omitindo a senha
            return res.status(200).json({
                success: true,
                message: 'Perfil acessado.',
                data: {
                    userId: req.userId,
                    role: req.userRole
                }
            });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao carregar perfil.' });
        }
    }
}

module.exports = new UserController();
