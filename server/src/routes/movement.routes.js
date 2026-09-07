const express = require('express');
const { listMovements, createMovement, deleteMovement } = require('../controllers/movement.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listMovements);
router.post('/', createMovement);
router.delete('/:id', deleteMovement);

module.exports = router;
