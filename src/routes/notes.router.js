const express = require('express');
const notesRoutes = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notesController = require('../controllers/notes.controller');

notesRoutes.post('/', authMiddleware, notesController.creatNote);
notesRoutes.get('/', authMiddleware, notesController.readNotes);
notesRoutes.delete('/:id', authMiddleware, notesController.deleteNotes);

module.exports = notesRoutes;
