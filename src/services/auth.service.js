const jwt = require('jsonwebtoken');
const db = require('../config/db'); // ваш модуль подключения к MySQL

function generateAccessToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '5ms',
    });
}

function generateRefreshToken(user) {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });
}

async function saveRefreshToken(userId, token) {
    await db.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
        [userId, token]
    );
}

async function removeRefreshToken(token) {
    await db.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
}

async function findRefreshToken(token) {
    const [rows] = await db.query(
        'SELECT * FROM refresh_tokens WHERE token = ?',
        [token]
    );
    return rows[0];
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    saveRefreshToken,
    removeRefreshToken,
    findRefreshToken,
};
