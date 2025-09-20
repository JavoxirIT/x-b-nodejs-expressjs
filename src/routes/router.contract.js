const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contract.controller');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post(
    'contracts',
    authMiddleware,
    upload.array('images', 10),
    contractController.createContract
);
router.get('/', authMiddleware, contractController.readContract);
router.get('/:id', authMiddleware, contractController.readOneContract);
router.patch(
    '/update',
    authMiddleware,
    contractController.addPayAndUpdateContract
);
router.delete('/:id', authMiddleware, contractController.deleteContract);
router.patch('/move/:id', authMiddleware, contractController.moveToArchive);

router.get(
    '/payments/:id',
    authMiddleware,
    contractController.getContractPayment
);
router.patch('/up-payment', authMiddleware, contractController.updatePayment);

module.exports = router;
