const express = require('express');
const router = express.Router();

// Importação das rotas de cada módulo
const userRoutes = require('./user.routes');
// const vehicleRoutes = require('./vehicle.routes'); // exemplo

// Definição dos prefixos para cada conjunto de rotas
router.use('/users', userRoutes);
// router.use('/vehicles', vehicleRoutes); 

module.exports = router;
