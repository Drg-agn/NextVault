const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const razorpayController = require("../controller/razorpay.controller");

router.post("/create-order", authMiddleware, razorpayController.createOrderController);
router.post("/verify-payment", authMiddleware, razorpayController.verifyPaymentController);

module.exports = router;