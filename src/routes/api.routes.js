const express = require('express');
const router = express.Router();
const db = require('../sqlite');
const jwt = require('jsonwebtoken');

// ==========================================
// Middleware: Extrai user_id do token JWT
// Todas as rotas de dados são protegidas por ele
// ==========================================
function authRequired(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autorizado.' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não encontrado.' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token inválido ou expirado.' });
        req.userId = decoded.id;
        next();
    });
}

// Helper para encapsular run/all do sqlite em Promises
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
        if (err) reject(err); else resolve(this);
    });
});
const dbAll = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) reject(err); else resolve(rows);
    });
});
const dbGet = (query, params = []) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
        if (err) reject(err); else resolve(row);
    });
});

const ALLOWED_TABLES = ['vehicles', 'fuels', 'maintenances', 'trash'];

// ==========================================
// GET /api/data/:table
// Retorna apenas registros do usuário logado
// ==========================================
router.get('/data/:table', authRequired, async (req, res) => {
    const table = req.params.table;
    if (!ALLOWED_TABLES.includes(table)) return res.status(400).json({ error: 'Tabela inválida' });

    try {
        const rows = await dbAll(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY id DESC`, [req.userId]);
        if (table === 'trash') {
            rows.forEach(r => { if (r.data) r.data = JSON.parse(r.data); });
        }
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// POST /api/data/:table
// Insere sempre com o user_id do token
// ==========================================
router.post('/data/:table', authRequired, async (req, res) => {
    const table = req.params.table;
    const uid = req.userId;

    try {
        let result;
        if (table === 'vehicles') {
            result = await dbRun(
                `INSERT INTO vehicles (user_id, plate, model, brand) VALUES (?, ?, ?, ?)`,
                [uid, req.body.plate, req.body.model, req.body.brand]
            );
        } else if (table === 'fuels') {
            result = await dbRun(
                `INSERT INTO fuels (user_id, vehicle_id, vehicle, cost, date) VALUES (?, ?, ?, ?, ?)`,
                [uid, req.body.vehicle_id, req.body.vehicle, req.body.cost, req.body.date]
            );
        } else if (table === 'maintenances') {
            result = await dbRun(
                `INSERT INTO maintenances (user_id, vehicle_id, vehicle, service, cost, date) VALUES (?, ?, ?, ?, ?, ?)`,
                [uid, req.body.vehicle_id, req.body.vehicle, req.body.service, req.body.cost, req.body.date]
            );
        } else {
            return res.status(400).json({ error: 'Tabela inválida' });
        }
        res.json({ success: true, id: result.lastID });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// PUT /api/data/:table/:id
// Atualiza apenas registros do próprio usuário
// ==========================================
router.put('/data/:table/:id', authRequired, async (req, res) => {
    const { table, id } = req.params;
    const uid = req.userId;

    try {
        if (table === 'vehicles') {
            await dbRun(`UPDATE vehicles SET plate = ?, model = ? WHERE id = ? AND user_id = ?`,
                [req.body.plate, req.body.model, id, uid]);
        } else if (table === 'fuels') {
            await dbRun(`UPDATE fuels SET cost = ? WHERE id = ? AND user_id = ?`,
                [req.body.cost, id, uid]);
        } else if (table === 'maintenances') {
            await dbRun(`UPDATE maintenances SET service = ?, cost = ? WHERE id = ? AND user_id = ?`,
                [req.body.service, req.body.cost, id, uid]);
        } else {
            return res.status(400).json({ error: 'Tabela inválida' });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// DELETE /api/data/:table/:id  (Soft delete -> Lixeira)
// Só pode excluir registros próprios
// ==========================================
router.delete('/data/:table/:id', authRequired, async (req, res) => {
    const { table, id } = req.params;
    const uid = req.userId;

    try {
        const item = await dbGet(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [id, uid]);
        if (!item) return res.status(404).json({ error: 'Registro não encontrado.' });

        await dbRun(
            `INSERT INTO trash (user_id, original_id, original_type, data, deleted_at) VALUES (?, ?, ?, ?, ?)`,
            [uid, id, table, JSON.stringify(item), new Date().toISOString()]
        );
        await dbRun(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, uid]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// POST /api/restore/:trash_id
// Restaura apenas itens da lixeira do próprio usuário
// ==========================================
router.post('/restore/:trash_id', authRequired, async (req, res) => {
    const uid = req.userId;
    try {
        const trashItem = await dbGet(`SELECT * FROM trash WHERE id = ? AND user_id = ?`, [req.params.trash_id, uid]);
        if (!trashItem) return res.status(404).json({ error: 'Item não encontrado na lixeira.' });

        const data = JSON.parse(trashItem.data);
        const table = trashItem.original_type;

        if (table === 'vehicles') {
            await dbRun(`INSERT INTO vehicles (user_id, plate, model, brand, status) VALUES (?, ?, ?, ?, ?)`,
                [uid, data.plate, data.model, data.brand, data.status || 'active']);
        } else if (table === 'fuels') {
            await dbRun(`INSERT INTO fuels (user_id, vehicle_id, vehicle, cost, date) VALUES (?, ?, ?, ?, ?)`,
                [uid, data.vehicle_id, data.vehicle, data.cost, data.date]);
        } else if (table === 'maintenances') {
            await dbRun(`INSERT INTO maintenances (user_id, vehicle_id, vehicle, service, cost, date) VALUES (?, ?, ?, ?, ?, ?)`,
                [uid, data.vehicle_id, data.vehicle, data.service, data.cost, data.date]);
        }

        await dbRun(`DELETE FROM trash WHERE id = ? AND user_id = ?`, [req.params.trash_id, uid]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
