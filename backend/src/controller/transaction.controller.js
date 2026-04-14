const mongoose = require("mongoose");
const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const { v4: uuidv4 } = require("uuid");
const emailService = require("../services/email.service");

/* ================= CREATE TRANSACTION ================= */
async function createTransactionController(req, res) {
    let transaction;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { fromAccountId, toAccountId, amount } = req.body;

        if (!fromAccountId || !toAccountId || !amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "fromAccountId, toAccountId, and amount are required"
            });
        }

        if (amount <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        if (fromAccountId === toAccountId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Cannot transfer to the same account"
            });
        }

        const fromUserAccount = await accountModel.findById(fromAccountId);
        const toUserAccount = await accountModel.findById(toAccountId);

        if (!fromUserAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Source account not found" });
        }

        if (!toUserAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Destination account not found" });
        }

        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
            });
        }

        const idempotencyKey = uuidv4();

        const isTransactionAlreadyExists = await transactionModel.findOne({ idempotencyKey });

        if (isTransactionAlreadyExists) {
            await session.abortTransaction();
            session.endSession();
            const statusMessages = {
                COMPLETED: "Transaction already processed",
                PENDING: "Transaction is still processing",
                FAILED: "Transaction already failed",
                REVERSED: "Transaction is already reversed"
            };
            return res.status(200).json({
                message: statusMessages[isTransactionAlreadyExists.status] || "Transaction already exists",
                transaction: isTransactionAlreadyExists
            });
        }

        const balance = await fromUserAccount.getBalance();
        if (balance < amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        const transactionDocs = await transactionModel.create([{
            fromAccount: fromAccountId,
            toAccount: toAccountId,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        transaction = transactionDocs[0];

        await ledgerModel.create([{
            account: fromAccountId,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        await ledgerModel.create([{
            account: toAccountId,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        emailService
            .sendTransactionEmail(req.user.email, req.user.name, amount, toAccountId)
            .catch(err => console.error("Email error:", err));

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

/* ================= GET TRANSACTIONS BY ACCOUNT ================= */
async function getTransactionsByAccountController(req, res) {
    try {
        const { accountId } = req.params;

        const transactions = await transactionModel.find({
            $or: [
                { fromAccount: accountId },
                { toAccount: accountId }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({ transactions });

    } catch (error) {
        console.error("Get Transactions Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    createTransactionController,
    getTransactionsByAccountController
};