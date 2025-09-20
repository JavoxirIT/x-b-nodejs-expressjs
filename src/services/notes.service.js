const notesModel = require('../models/notes.model');

exports.createNote = async data => {
    const result = await notesModel.create(data);
    if (result.length > 0) {
        return result[0];
    }
    throw new Error('Note not created');
};

exports.readAll = async () => {
    const result = await notesModel.read();
    if (result.length === 0) {
        return [];
    }
    return result;
};

exports.deleteNotes = async id => {
    const result = await notesModel.delete(id);
    if (result) {
        return result;
    }
    throw result;
};
