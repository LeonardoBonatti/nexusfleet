const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rotas públicas
router.post('/register', userController.register);
router.post('/login', userController.login);

// Rotas protegidas (Exigem JWT)
router.get('/profile', authMiddleware, userController.getProfile);

module.exports = router;
