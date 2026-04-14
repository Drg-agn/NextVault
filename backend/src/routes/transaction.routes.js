const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require('../controller/transaction.controller');

router.post('/', authMiddleware, transactionController.createTransactionController);
router.get('/:accountId', authMiddleware, transactionController.getTransactionsByAccountController);

module.exports = router;