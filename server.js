/**
 * server.js
 * Ponto de entrada da aplicação.
 * Responsável por configurar o Express, instanciar rotas e iniciar o servidor.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json()); // Permite ler JSON no body das requisições

// Serve os arquivos do site (Frontend) diretamente
const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota da API base (agora acessada em /api/status)
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'Fuel Control System API está rodando!',
        version: '1.0.0'
    });
});

// Força acesso na rota raiz (/) a retornar o HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Importação das Rotas da API
const apiRoutes = require('./src/routes/api.routes');
app.use('/api', apiRoutes);

// Tratamento de Rota não encontrada (404)
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint não encontrado.' });
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na base URL: http://localhost:${PORT}`);
    console.log(`ℹ️  Pressione CTRL+C para parar o servidor.`);
});
