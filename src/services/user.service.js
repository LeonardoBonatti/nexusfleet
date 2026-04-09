const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

/**
 * UserService
 * Contém regras de negócio da entidade User (Cadastro, Login).
 */
class UserService {
    /**
     * Registra um novo usuário com senha devidamente hasheada
     */
    async registerUser(data) {
        // Validação de e-mail existente
        const existingUser = await userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new ErrorResponse('Email já está em uso.', 400);
        }

        // Criptografia da senha
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);

        // Prepara modelo
        const userModel = new User({
            name: data.name,
            email: data.email,
            password_hash: passwordHash,
            role: data.role || 'user'
        });

        // Grava via Repository
        const createdUser = await userRepository.create(userModel);
        return createdUser;
    }

    /**
     * Realiza login retornando token JWT se credenciais válidas
     */
    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        
        if (!user) {
            throw new ErrorResponse('Credenciais inválidas. Usuário não encontrado.', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new ErrorResponse('Credenciais inválidas. Senha incorreta.', 401);
        }

        // Geração do token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: process.env.JWT_EXPIRATION || '24h' }
        );

        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token
        };
    }
}

module.exports = new UserService();
