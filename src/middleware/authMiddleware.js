const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token formati yaroqsiz.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            message: 'Kirish tokeni yaroqsiz yoki muddati oʻtgan',
        });
    }
};

// module.exports = (req, res, next) => {
//     const authHeader = req.headers['authorization'];

//     if (!authHeader?.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'Формат токена неверный' });
//     }

//     const token = authHeader && authHeader.split(' ')[1]; // формат: "Bearer token"

//     if (!token) {
//         return res
//             .status(401)
//             .json({ message: 'Нет токена, авторизация отклонена' });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded; // кладём данные пользователя в req
//         next();
//     } catch (err) {
//         return res
//             .status(403)
//             .json({ message: 'Неверный или просроченный токен' });
//     }
// };

// const jwt = require('jsonwebtoken');

// function auth(req, res, next) {
//     const token = req.headers['authorization']?.split(' ')[1];
//     if (!token) return res.status(401).json({ message: 'No token provided' });

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
//         req.user = decoded;
//         next();
//     } catch (err) {
//         res.status(403).json({ message: 'Invalid token' });
//     }
// }

// module.exports = auth;
