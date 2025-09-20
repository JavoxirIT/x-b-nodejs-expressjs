const contractModel = require('../models/contract.model');

exports.readArchive = async value => {
    const rows = await contractModel.readAll(value);

    if (!rows || rows.length === 0) {
        throw new Error('Arxivda ma`lumotlar mavjud emas');
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
