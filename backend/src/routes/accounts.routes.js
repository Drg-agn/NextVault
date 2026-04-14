const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controller/account.controller");

router.post("/", authMiddleware, accountController.createAccountController);

router.post(
    "/system/initial-funds",
    authMiddleware,
    accountController.initialFundsController
);

router.get("/", authMiddleware, accountController.getUserAccountsController);

router.get(
    "/:accountId/balance",
    authMiddleware,
    accountController.getAccountBalanceController
);

module.exports = router;