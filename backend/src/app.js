const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const razorpayRoutes = require("./routes/razorpay.routes");
// Add with your other route imports
const chatRoutes = require("./routes/chat.routes");


const app = express();

// ✅ CORS — must be before all routes
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/accounts.routes");
const transactionRoutes = require("./routes/transaction.routes");

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/chat", chatRoutes);
module.exports = app;
