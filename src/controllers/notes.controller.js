const service = require('../services/notes.service');

exports.creatNote = async (req, res) => {
    try {
        const data = req.body.data;
        if (!data) {
            return res.status(400).json({ message: 'Zametka qani' });
        }
        const result = await service.createNote(data);
        return res.json({ message: "Qo'shildi", data: result });
    } catch (error) {
        return res.json(error);
    }
};
exports.readNotes = async (req, res) => {
    try {
        const data = await service.readAll();
        return res.status(200).json(data);
    } catch (error) {
        return res.json(error);
    }
};

exports.deleteNotes = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) {
            return res.status(400).json({ message: 'ID Kiritilmagan' });
        }

        const result = await service.deleteNotes(id);

        return res.status(200).json({ message: 'O`chirildi', data: result });
    } catch (error) {
        return resume.status(500).json(error);
    }
};
