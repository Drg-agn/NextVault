const Razorpay = require("razorpay");
const crypto = require("crypto");
const accountModel = require("../models/account.model");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ================= CREATE ORDER ================= */
async function createOrderController(req, res) {
    try {
        const { amount, accountId } = req.body;

        if (!amount || !accountId) {
            return res.status(400).json({
                message: "amount and accountId are required"
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        // Razorpay amount is in paise (1 INR = 100 paise)
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
          receipt: `rcpt_${Date.now()}`,
            notes: {
                accountId,
                userId: req.user._id.toString()
            }
        });

        res.status(201).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

/* ================= VERIFY PAYMENT & CREDIT ACCOUNT ================= */
async function verifyPaymentController(req, res) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            accountId,
            amount
        } = req.body;

        // ✅ Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                message: "Payment verification failed — invalid signature"
            });
        }

        // ✅ Credit account
        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const idempotencyKey = `razorpay-${razorpay_payment_id}`;

        // Check if already processed
        const alreadyProcessed = await transactionModel.findOne({ idempotencyKey });
        if (alreadyProcessed) {
            return res.status(200).json({
                message: "Payment already processed",
                transaction: alreadyProcessed
            });
        }

        // Create transaction
        const transaction = await transactionModel.create({
            fromAccount: accountId,
            toAccount: accountId,
            amount: amount / 100, // convert paise to INR
            status: "COMPLETED",
            idempotencyKey
        });

        // Create ledger CREDIT entry
        await ledgerModel.create({
            account: accountId,
            transaction: transaction._id,
            type: "CREDIT",
            amount: amount / 100
        });

        res.status(200).json({
            message: "Payment verified and account credited successfully",
            transaction
        });

    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    createOrderController,
    verifyPaymentController
};