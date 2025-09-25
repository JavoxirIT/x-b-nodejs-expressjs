const express = require('express');
const authMiddleware = require('../middleware/authMiddleware.js');
const router = express.Router();
const {
    register,
    login,
    refresh,
    logout,
    passwordAndLoginchange,
} = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/register', register);
router.post('/change', authMiddleware, passwordAndLoginchange);

module.exports = router;
