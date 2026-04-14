const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");

/* ================= CREATE ACCOUNT ================= */
async function createAccountController(req, res) {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "User not authenticated"
            });
        }

        const account = await accountModel.create({
            user: user._id
        });

        res.status(201).json({ account });

    } catch (error) {
        console.error("Create Account Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

/* ================= INITIAL FUNDS ================= */
async function initialFundsController(req, res) {
    try {
        const { accountId, amount } = req.body;

        if (!accountId || !amount) {
            return res.status(400).json({
                message: "accountId and amount are required"
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        const account = await accountModel.findById(accountId);

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const idempotencyKey = `initial-funds-${accountId}-${Date.now()}`;

        const transaction = await transactionModel.create({
            fromAccount: accountId,
            toAccount: accountId,
            amount,
            status: "COMPLETED",
            idempotencyKey
        });

   await ledgerModel.create({
    account: accountId,
    transaction: transaction._id,
    type: "CREDIT",
    amount: amount  
});
        res.status(201).json({
            message: "Initial funds added successfully",
            transaction
        });

    } catch (error) {
        console.error("Initial Funds Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

/* ================= GET ACCOUNT BALANCE ================= */
async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const balance = await account.getBalance();

        res.status(200).json({
            accountId: account._id,
            balance
        });

    } catch (error) {
        console.error("Get Balance Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

/* ================= GET USER ACCOUNTS ================= */
async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id });

        res.status(200).json({ accounts });

    } catch (error) {
        console.error("Get User Accounts Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    createAccountController,
    initialFundsController,
    getAccountBalanceController,
    getUserAccountsController
};