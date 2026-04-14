const express = require("express");
const router = express.Router();
const { chatController } = require("../controller/chat.controller");
const authMiddleware = require("../middleware/auth.middleware"); // ✅ no curly braces

router.post("/", authMiddleware, chatController);

module.exports = router;