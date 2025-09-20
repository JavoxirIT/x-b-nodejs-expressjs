const express = require('express');
const router = express.Router();
const {
    register,
    login,
    refresh,
    logout,
} = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/register', register);

module.exports = router;
