const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const razorpayRoutes = require("./routes/razorpay.routes");
const chatRoutes = require("./routes/chat.routes");


const app = express();

// ✅ FIXED: allow both localhost and your Vercel deployment
const allowedOrigins = [
  "http://localhost:5173",
  "https://next-vault-aqxp-git-main-drg-agns-projects.vercel.app",
  "https://next-vault-aqxp-f657zbmp4-drg-agns-projects.vercel.app",
  "https://next-vault-aqxp.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
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
