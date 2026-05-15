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

// Middleware de Logs para Debug (Railway)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rota da API base
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'NexusFleet API está rodando com SQLite!',
        version: '1.2.0'
    });
});

// Importação das Rotas da API (SQLite)
const apiRoutes = require('./src/routes/api.routes.js');
app.use('/api', apiRoutes);

const userRoutes = require('./src/routes/user.routes.js');
app.use('/api/users', userRoutes);

// Serve os arquivos do site (Frontend SPA) - Colocado após a API para não conflitar
const frontendPath = path.join(process.cwd(), 'frontend');
app.use(express.static(frontendPath));

// Força acesso na rota raiz (/) a retornar o index.html ou redirecionar se necessário
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Tratamento de Rota não encontrada (404) para API vs Frontend
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint da API não encontrado.' });
    }
    // Para rotas do frontend que não existem como arquivos, envia o index.html (padrão SPA)
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
        if (err) {
            res.status(404).json({ error: 'Arquivo frontend não encontrado.' });
        }
    });
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
