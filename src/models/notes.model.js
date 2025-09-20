const db = require('../config/db');
exports.create = async data => {
    const [result] = await db.query('INSERT INTO notes (data) VALUES (?)', [
        data,
    ]);

    if (result.affectedRows) {
        const [newData] = await db.query('SELECT * FROM notes WHERE id=?', [
            result.insertId,
        ]);
        return newData;
    }

    throw new Error('Insert failed');
};

exports.read = async () => {
    const [result] = await db.query('SELECT * FROM notes ORDER BY id DESC');
    return result;
};

exports.delete = async id => {
    const [result] = await db.query('DELETE FROM notes WHERE id=?', [id]);
    if (result.affectedRows) {
        return 1;
    }
    throw new Error('Ma`lumot o`chirilmadi');
};
