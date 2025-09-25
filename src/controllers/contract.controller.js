const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const contractService = require('../services/contract.service');

//TODO записать один
exports.createContract = async (req, res) => {
    const files = req.files; // массив файлов
    try {
        const result = await contractService.createContract(
            {
                userId: req.user.id,
                ...req.body,
            },
            files
        );

        if (!result) {
            return res.status(400).json({
                message: 'Ma`lumot saqlanmadi',
            });
        }

        res.status(201).json({
            message: 'Ma`lumot saqlandi',
        });
    } catch (err) {
        res.status(500).json({
            message: 'Xatolik yuz berdi',
            error: err.message,
        });
    }
};
//TODO прочитать все
exports.readContract = async (req, res) => {
    const value = parseInt(req.query.finaly, 10);
    try {
        const contracts = await contractService.readContract(value);
        if (contracts.length === 0) {
            return res
                .status(404)
                .json({ data: contracts, message: 'Shartnomalar mavjud emas' });
        }
        return res.status(200).json(contracts);
    } catch (err) {
        return res.status(500).json({
            error: err.message || 'Shartnomalarni olishda xatolik yuz berdi',
        });
    }
};

//TODO прочитать один
exports.readOneContract = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) {
        return res.status(400).json({ message: 'ID kiritilmagan' });
    }
    try {
        const resultData = await contractService.readFindContarct(id);
        return res.status(200).json(resultData);
    } catch (err) {
        return res.status(500).json({
            error: err.message || 'Shartnomalar mavjud emas',
        });
    }
};

//TODO обновить один
exports.addPayAndUpdateContract = async (req, res) => {
    const id = parseInt(req.query.id, 10),
        pay = parseInt(req.query.pay, 10),
        date = req.query.date;

    if (!id) {
        return res.status(400).json({ message: 'ID kiritilmagan' });
    }

    if (!pay || pay < 0) {
        return res.status(400).json({ message: 'To`lov summasi noto`g`ri' });
    }
    try {
        const result = await contractService.addPayAndUpdateContract(
            id,
            pay,
            date,
            1
        );
        return res.status(201).json(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

//TODO переметить в архив т восстановить
exports.moveToArchive = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const param = parseInt(req.query.param, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    try {
        const result = await contractService.moveToArchive(id, param);
        return res.status(200).json(result);
    } catch (err) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ error: 'Kontract topilmadi' });
        }
        return res.status(500).json({ error: 'Server error' });
    }
};

//TODO удалить один
exports.deleteContract = async (req, res) => {
    const id = parseInt(req.params.id, 10);

    try {
        // 1. Получаем все пути к изображениям
        const [images] = await db.query(
            'SELECT image_path FROM contract_images WHERE contract_id = ?',
            [id]
        );

        // 2. Удаляем физические файлы
        for (const img of images) {
            const filePath = path.join(
                __dirname,
                '..',
                'uploads',
                img.image_path
            );
            try {
                if (fs.existsSync(filePath)) {
                    fs.promises.unlink(filePath); //fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error(
                    `Ошибка при удалении файла ${filePath}:`,
                    err.message
                );
            }
        }

        // 3. Удаляем контракт (MySQL сам удалит contract_images по CASCADE)
        await db.query('DELETE FROM contract WHERE id = ?', [id]);

        return res.status(200).json({ message: 'Контракт и файлы удалены' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

//TODO получения оплат
exports.getContractPayment = async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (!id) {
        return res.status(400).json({ message: 'ID kiritilmagan' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM payments WHERE contract_id = ? ORDER BY id DESC',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'To`lov mavjud emas' });
        }

        return res.status(200).json([...rows]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

//TODO изминения оплат

exports.updatePayment = async (req, res) => {
    const pay_id = parseInt(req.body.pay_id, 10),
        contract_id = parseInt(req.body.contract_id, 10),
        prev_pay = parseInt(req.body.prev_pay, 10),
        next_pay = parseInt(req.body.next_pay, 10),
        date = req.body.date;
    if (!pay_id || prev_pay < 0 || next_pay < 0 || !date) {
        return res.status(400).json({ message: 'Ma`lumotlar to`liq emas' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [contractUpdate] = await connection.query(
            `
            UPDATE contract 
            SET next_payment = next_payment - ? + ? 
            WHERE id = ?
              AND (next_payment - ? + ?) <= (price + added_anmount - first_payment)
            `,
            [prev_pay, next_pay, contract_id, prev_pay, next_pay]
        );
        if (contractUpdate.affectedRows === 0) {
            throw new Error(
                `Xato: summa ruxsat etilgan chegaradan oshib ketdi yoki №${contract_id} shartnomasi topilmadi`
            );
        }

        const [paymentUpdate] = await connection.query(
            'UPDATE payments SET pay = ? , date = ? WHERE id = ? AND contract_id = ?',
            [next_pay, date, pay_id, contract_id]
        );
        if (paymentUpdate.affectedRows === 0) {
            throw new Error(`To'lov № ${contract_id} yangilanmadi`);
        }

        const [finalyUpdate] = await connection.query(
            `UPDATE contract
             SET finaly = 1
             WHERE id = ? AND price + added_anmount - first_payment = next_payment`,
            [contract_id]
        );
        await connection.commit();

        return res.status(200).json({
            message: 'To`lov muvaffaqiyatli tahrirlandi',
            paymentId: pay_id,
            contractId: contract_id,
            updates: {
                contractRows: contractUpdate.affectedRows,
                paymentRows: paymentUpdate.affectedRows,
                finalyRows: finalyUpdate.affectedRows,
            },
        });
    } catch (error) {
        await connection.rollback();
        return res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};
