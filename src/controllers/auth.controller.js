const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authService = require('../services/auth.service');
exports.login = async (req, res) => {
    const { username, password } = req.body;

    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [
        username,
    ]);
    const user = users[0];
    if (!user)
        return res
            .status(400)
            .json({ message: `Foydalanuvchi \"${username}\" topilmadi` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Parol notug'ri" });

    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // нельзя прочитать JS на фронтенде
        secure: false, // локально используем HTTP, для продакшна HTTPS → true
        sameSite: 'lax', // 'lax' для локального теста, 'none' требует HTTPS
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        path: '/', // cookie доступна на всех маршрутах сервера
    });

    await authService.saveRefreshToken(user.id, refreshToken);

    res.json({ accessToken, refreshToken });
};

exports.refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken; // берем из cookie

    if (!refreshToken) {
        return res.status(401).json({ message: 'Нет refresh токена' });
    }

    const tokenInDb = await authService.findRefreshToken(refreshToken);
    if (!tokenInDb) {
        return res
            .status(403)
            .json({ message: 'Refresh токен недействителен' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [
            decoded.id,
        ]);
        const user = users[0];
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const newAccessToken = authService.generateAccessToken(user);
        const newRefreshToken = authService.generateRefreshToken(user);

        await authService.removeRefreshToken(refreshToken);
        await authService.saveRefreshToken(user.id, newRefreshToken);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true, // нельзя прочитать JS на фронтенде
            secure: false, // локально используем HTTP, для продакшна HTTPS → true
            sameSite: 'lax', // 'lax' для локального теста, 'none' требует HTTPS
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
            path: '/', // cookie доступна на всех маршрутах сервера
        });

        res.json({
            accessToken: newAccessToken,
        });
    } catch (err) {
        return res
            .status(403)
            .json({ message: 'Неверный или просроченный refresh токен' });
    }
};

exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
        return res.status(400).json({ message: 'Нет refresh токена' });

    await authService.removeRefreshToken(refreshToken);
    res.status(200).json({ message: 'Sistemadan chiqildi' });
};

exports.register = async (req, res) => {
    try {
        if (!req.body) {
            return res
                .status(400)
                .json({ message: "Ma'lumotlar yuborilmagan" });
        }
        const { username, password } = req.body;

        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Maydonlarni to'ldirilmagan" });
        }

        // проверяем, есть ли пользователь
        const [existing] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        if (existing.length > 0) {
            return res
                .status(400)
                .json({ message: 'Bu foydalanuvchi allaqachon mavjud.' });
        }

        // хэшируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // создаём пользователя
        const [result] = await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );

        // сразу выдаём access+refresh токены
        const user = { id: result.insertId, username };

        const accessToken = authService.generateAccessToken(user);
        const refreshToken = authService.generateRefreshToken(user);

        await authService.saveRefreshToken(user.id, refreshToken);

        res.status(201).json({
            message: 'Foydalanuvchi yaratildi',
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Serverda xatolik' });
    }
};

// exports.login = async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const [rows] = await db.query(
//             'SELECT * FROM users WHERE username = ?',
//             [username]
//         );
//         if (rows.length === 0)
//             return res
//                 .status(400)
//                 .json({ message: 'Invalid login or password' });

//         const user = rows[0];
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch)
//             return res
//                 .status(400)
//                 .json({ message: 'Invalid login or password' });

//         const token = jwt.sign(
//             { id: user.id, email: user.username },
//             process.env.JWT_SECRET || 'secret',
//             { expiresIn: '1y' }
//         );

//         res.json({ token });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };
