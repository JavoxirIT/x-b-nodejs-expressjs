const db = require('../config/db');

exports.create = async (
    {
        price,
        addedAnmount,
        clientName,
        avto,
        startDate,
        endDate,
        firstPayment,
        userId,
    },
    con = db
) => {
    const [result] = await con.query(
        'INSERT INTO contract (name, avto_info, start_date, end_date, price, added_anmount,first_payment, finaly, user_id, next_payment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            clientName,
            avto,
            startDate,
            endDate,
            price,
            addedAnmount,
            firstPayment,
            0,
            userId,
            0,
        ]
    );

    return result;
};

exports.update = async (d, conId) => {
    const [result] = await db.query(
        `UPDATE contract 
		 SET name=?, avto_info=?, start_date=?, end_date=?, price=?, added_anmount=?, first_payment=? 
		 WHERE id=? AND finaly=0`,
        [
            d.clientName,
            d.avto,
            d.startDate,
            d.endDate,
            d.price,
            d.addedAnmount,
            d.firstPayment,
            conId,
        ]
    );
    return result;
};

exports.insertFile = async (values, con = db) => {
    const [result] = await con.query(
        'INSERT INTO contract_images (contract_id, image_path) VALUES ?',
        [values]
    );
    return result;
};

exports.readAll = async finallyValuye => {
    const [rows] = await db.query(
        `
				SELECT c.id, c.name, c.avto_info, c.start_date, c.end_date, c.price, 
					   c.added_anmount, c.first_payment, c.finaly, c.user_id, c.next_payment,
					   GROUP_CONCAT(ci.image_path) AS images
				FROM contract c
				LEFT JOIN contract_images ci ON c.id = ci.contract_id
				WHERE c.finaly = ?
				GROUP BY c.id ORDER BY c.id DESC;
			`,
        [finallyValuye]
    );
    return rows;
};

exports.readFind = async id => {
    const [rows] = await db.query(
        `
			SELECT c.id, c.name, c.avto_info, c.start_date, c.end_date, c.price, 
				c.added_anmount, c.first_payment, c.finaly, c.user_id, c.next_payment,
				GROUP_CONCAT(ci.image_path) AS images
			FROM contract c
			LEFT JOIN contract_images ci ON c.id = ci.contract_id
			WHERE c.id = ?
			GROUP BY c.id
		`,
        [id]
    );

    return rows;
};

exports.updateFinally = async (id, param) => {
    const [rows] = await db.query('UPDATE contract SET finaly=? WHERE id = ?', [
        param,
        id,
    ]);
    return rows;
};
//
exports.insertPay = async (id, pay, d, con) => {
    const [result] = await con.query(
        `INSERT INTO payments (contract_id, pay, \`date\`) VALUES (?, ?, ?)`,
        [id, pay, d]
    );

    return result;
};

exports.updateNextPayment = async (pay, id, pay2, con) => {
    const [contractUpdate] = await con.query(
        `UPDATE contract
			SET next_payment = next_payment + ?
			WHERE id = ? AND
			(next_payment + ?) <= (price + added_anmount - first_payment)
        `,
        [pay, id, pay2]
    );
    return contractUpdate;
};

exports.updateFinallyElse = async (fValue, id, con) => {
    const [updateFinaly] = await con.query(
        `UPDATE contract
         SET finaly = ?
         WHERE id = ?
         AND price + added_anmount - first_payment = next_payment
        `,
        [fValue, id]
    );
    return updateFinaly;
};
