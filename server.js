/**
 * server.js
 * Ponto de entrada da aplicação NexusFleet.
 * Conecta com o SQLite e serve o frontend SPA.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json()); // Permite ler JSON no body das requisições

// Serve os arquivos do site (Frontend SPA) diretamente
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota da API base
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'NexusFleet API está rodando com SQLite!',
        version: '1.1.0'
    });
});

// Importação das Rotas da API (SQLite)
const apiRoutes = require('./src/routes/api.routes');
app.use('/api', apiRoutes);

// Força acesso na rota raiz (/) a retornar o HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Tratamento de Rota não encontrada (404)
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint não encontrado.' });
});

// Inicialização do Servidor com fallback de porta para evitar EADDRINUSE e bind 0.0.0.0 para Railway
let PORT = process.env.PORT || 3000;

function startServer(port) {
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Servidor rodando na base URL: http://0.0.0.0:${port}`);
        console.log(`ℹ️  Pressione CTRL+C para parar o servidor.`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  Porta ${port} ocupada. Tentando a porta ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('❌ Erro fatal no servidor:', err);
        }
    });
}

startServer(PORT);
