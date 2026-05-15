const express = require('express');
const router = express.Router();
const db = require('../database/sqlite');
const jwt = require('jsonwebtoken');

// ==========================================
// Middleware JWT
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

// Helpers de Promise para SQLite
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
// ==========================================
router.post('/data/:table', authRequired, async (req, res) => {
    const table = req.params.table;
    const uid = req.userId;
    try {
        let result;
        if (table === 'vehicles') {
            // Validação Mercosul: LLLNLNN ou antigo LLLNNNN
            const plate = (req.body.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(plate);
            const antigo = /^[A-Z]{3}[0-9]{4}$/.test(plate);
            if (!mercosul && !antigo) {
                return res.status(400).json({ error: 'Placa inválida. Use o padrão Mercosul (ABC1D23) ou antigo (ABC1234).' });
            }
            result = await dbRun(
                `INSERT INTO vehicles (user_id, plate, model, brand, year, fuel_type, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uid, plate, req.body.model, req.body.brand, req.body.year || null, req.body.fuel_type || 'Flex', req.body.capacity || 0]
            );
        } else if (table === 'fuels') {
            // Busca capacidade do veículo para validação
            const vehicle = await dbGet(`SELECT capacity FROM vehicles WHERE id = ? AND user_id = ?`, [req.body.vehicle_id, uid]);
            const capacity = vehicle ? parseFloat(vehicle.capacity) : 0;
            const liters = parseFloat(req.body.liters) || 0;
            if (capacity > 0 && liters > capacity) {
                return res.status(400).json({ error: `Volume (${liters}L) excede a capacidade do tanque (${capacity}L).` });
            }

            // Validação do horímetro
            if (req.body.horimeter) {
                const lastFuel = await dbGet(
                    `SELECT MAX(horimeter) as last_h FROM fuels WHERE vehicle_id = ? AND user_id = ?`,
                    [req.body.vehicle_id, uid]
                );
                const lastMaint = await dbGet(
                    `SELECT MAX(horimeter) as last_h FROM maintenances WHERE vehicle_id = ? AND user_id = ?`,
                    [req.body.vehicle_id, uid]
                );
                const lastH = Math.max(lastFuel?.last_h || 0, lastMaint?.last_h || 0);
                const newH = parseFloat(req.body.horimeter);
                if (newH < lastH) {
                    return res.status(400).json({ error: `Horímetro (${newH}h) não pode ser menor que o último registrado (${lastH}h).` });
                }
            }

            const pricePerLiter = parseFloat(req.body.price_per_liter) || 0;
            const cost = liters * pricePerLiter;
            result = await dbRun(
                `INSERT INTO fuels (user_id, vehicle_id, vehicle, fuel_type, liters, price_per_liter, cost, odometer, horimeter, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uid, req.body.vehicle_id, req.body.vehicle, req.body.fuel_type || 'Gasolina Comum',
                    liters, pricePerLiter, req.body.cost || cost,
                    req.body.odometer || 0, req.body.horimeter || 0,
                    req.body.date || new Date().toLocaleDateString('pt-BR')]
            );
        } else if (table === 'maintenances') {
            // Validação do horímetro em manutenção
            if (req.body.horimeter) {
                const lastFuel = await dbGet(
                    `SELECT MAX(horimeter) as last_h FROM fuels WHERE vehicle_id = ? AND user_id = ?`,
                    [req.body.vehicle_id, uid]
                );
                const lastMaint = await dbGet(
                    `SELECT MAX(horimeter) as last_h FROM maintenances WHERE vehicle_id = ? AND user_id = ?`,
                    [req.body.vehicle_id, uid]
                );
                const lastH = Math.max(lastFuel?.last_h || 0, lastMaint?.last_h || 0);
                const newH = parseFloat(req.body.horimeter);
                if (newH < lastH) {
                    return res.status(400).json({ error: `Horímetro (${newH}h) não pode ser menor que o último registrado (${lastH}h).` });
                }
            }
            result = await dbRun(
                `INSERT INTO maintenances (user_id, vehicle_id, vehicle, service, cost, horimeter, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uid, req.body.vehicle_id, req.body.vehicle, req.body.service,
                    parseFloat(req.body.cost) || 0, req.body.horimeter || 0,
                    req.body.date || new Date().toLocaleDateString('pt-BR')]
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
// ==========================================
router.put('/data/:table/:id', authRequired, async (req, res) => {
    const { table, id } = req.params;
    const uid = req.userId;
    try {
        if (table === 'vehicles') {
            await dbRun(`UPDATE vehicles SET plate = ?, model = ?, brand = ?, capacity = ? WHERE id = ? AND user_id = ?`,
                [req.body.plate, req.body.model, req.body.brand || '', req.body.capacity || 0, id, uid]);
        } else if (table === 'fuels') {
            await dbRun(`UPDATE fuels SET cost = ?, fuel_type = ?, liters = ? WHERE id = ? AND user_id = ?`,
                [req.body.cost, req.body.fuel_type || 'Gasolina Comum', req.body.liters || 0, id, uid]);
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
// DELETE /api/data/:table/:id (Soft delete)
// ==========================================
router.delete('/data/:table/:id', authRequired, async (req, res) => {
    const { table, id } = req.params;
    const uid = req.userId;
    try {
        const item = await dbGet(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [id, uid]);
        if (!item) return res.status(404).json({ error: 'Registro não encontrado.' });
        await dbRun(
            `INSERT INTO trash (user_id, original_id, original_type, data) VALUES (?, ?, ?, ?)`,
            [uid, id, table, JSON.stringify(item)]
        );
        await dbRun(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, uid]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// POST /api/restore/:trash_id
// ==========================================
router.post('/restore/:trash_id', authRequired, async (req, res) => {
    const uid = req.userId;
    try {
        const trashItem = await dbGet(`SELECT * FROM trash WHERE id = ? AND user_id = ?`, [req.params.trash_id, uid]);
        if (!trashItem) return res.status(404).json({ error: 'Item não encontrado na lixeira.' });
        const data = JSON.parse(trashItem.data);
        const table = trashItem.original_type;
        if (table === 'vehicles') {
            await dbRun(`INSERT INTO vehicles (user_id, plate, model, brand, year, fuel_type, capacity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [uid, data.plate, data.model, data.brand || '', data.year, data.fuel_type || 'Flex', data.capacity || 0, data.status || 'active']);
        } else if (table === 'fuels') {
            await dbRun(`INSERT INTO fuels (user_id, vehicle_id, vehicle, fuel_type, liters, price_per_liter, cost, odometer, horimeter, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uid, data.vehicle_id, data.vehicle, data.fuel_type || 'Gasolina Comum', data.liters || 0, data.price_per_liter || 0, data.cost, data.odometer || 0, data.horimeter || 0, data.date]);
        } else if (table === 'maintenances') {
            await dbRun(`INSERT INTO maintenances (user_id, vehicle_id, vehicle, service, cost, horimeter, date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uid, data.vehicle_id, data.vehicle, data.service, data.cost, data.horimeter || 0, data.date]);
        }
        await dbRun(`DELETE FROM trash WHERE id = ? AND user_id = ?`, [req.params.trash_id, uid]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// GET /api/vehicles/:id/last-horimeter
// Retorna o maior horímetro já registrado para um veículo
// ==========================================
router.get('/vehicles/:id/last-horimeter', authRequired, async (req, res) => {
    const uid = req.userId;
    try {
        const lastFuel = await dbGet(
            `SELECT MAX(horimeter) as last_h FROM fuels WHERE vehicle_id = ? AND user_id = ?`,
            [req.params.id, uid]
        );
        const lastMaint = await dbGet(
            `SELECT MAX(horimeter) as last_h FROM maintenances WHERE vehicle_id = ? AND user_id = ?`,
            [req.params.id, uid]
        );
        const lastH = Math.max(lastFuel?.last_h || 0, lastMaint?.last_h || 0);
        res.json({ last_horimeter: lastH });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
