const contractModel = require('../models/contract.model');
const db = require('../config/db');

exports.createContract = async (data, files) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const result = await contractModel.create(data, connection);
        const contractId = result.insertId;

        if (files && files.length > 0) {
            const values = files.map(file => [contractId, file.filename]);
            await contractModel.insertFile(values, connection);
        }
        await connection.commit();
        return true;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

exports.readContract = async value => {
    const rows = await contractModel.readAll(value);

    if (!rows || rows.length === 0) {
        return [];
    }

    return rows.map(contract => {
        const totalAnmount =
            Number(contract.price) + Number(contract.added_anmount);
        const remainingAmount =
            totalAnmount -
            (Number(contract.first_payment) + Number(contract.next_payment));

        return {
            ...contract,
            totalAnmount,
            remainingAmount,
            images: contract.images?.length ? contract.images.split(',') : [],
        };
    });
};

exports.readFindContarct = async id => {
    const rows = await contractModel.readFind(id);

    if (!rows || rows.length === 0) {
        throw new Error(`Shartnoma №${id} mavjud emas`);
    }
    const contract = rows[0];

    const totalAnmount =
        Number(contract.price) + Number(contract.added_anmount);
    const remainingAmount =
        totalAnmount -
        (Number(contract.first_payment) + Number(contract.next_payment));

    return {
        ...contract,
        totalAnmount,
        remainingAmount,
        images: contract.images ? contract.images.split(',') : [],
    };
};

exports.moveToArchive = async (id, param) => {
    try {
        const result = await contractModel.updateFinally(id, param);

        if (!result || result.affectedRows === 0) {
            throw new Error('Arxivga o`tkazishda xatolik');
        }

        return {
            message: 'Muvofaqiyatli',
            id,
        };
    } catch (err) {
        throw new Error(err.message || 'Server xatosi');
    }
};

exports.addPayAndUpdateContract = async (id, pay, date, fValue) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const updateNextPayemt = await contractModel.updateNextPayment(
            pay,
            id,
            pay,
            connection
        );

        if (updateNextPayemt.affectedRows === 0) {
            throw new Error(
                `Xato: summa ruxsat etilgan chegaradan oshib ketdi yoki №${id} shartnomasi topilmadi`
            );
        }
        const result = await contractModel.insertPay(id, pay, date, connection);

        const updateFinally = await contractModel.updateFinallyElse(
            fValue,
            id,
            connection
        );
        await connection.commit();

        return {
            message: 'To`lov kiritildi',
            contractId: id,
            data: {
                id: result.insertId,
                date,
                pay,
            },
            updates: {
                contractRows: updateNextPayemt.affectedRows,
                finalyRows: updateFinally.affectedRows,
            },
        };
    } catch (err) {
        await connection.rollback();
        throw new Error('Aamallar bajarilmadi');
    } finally {
        connection.release();
    }
};
