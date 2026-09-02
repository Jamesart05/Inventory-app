const express = require('express');
const { signup, signin, logout, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;
