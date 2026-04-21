const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const razorpayRoutes = require("./routes/razorpay.routes");
const chatRoutes = require("./routes/chat.routes");

const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/accounts.routes");
const transactionRoutes = require("./routes/transaction.routes");

const app = express();


// ✅ SECURE + PRODUCTION-READY CORS CONFIG
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);

    try {
      const url = new URL(origin);

      // ✅ Allow localhost (development)
      if (url.hostname === "localhost") {
        return callback(null, true);
      }

      // ✅ Allow ALL Vercel deployments (dynamic URLs)
      if (url.hostname.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    } catch (err) {
      return callback(new Error("Invalid origin"));
    }
  },
  credentials: true
}));


// Middlewares
app.use(express.json());
app.use(cookieParser());


// Routes
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/chat", chatRoutes);


// Optional: health check route (useful for testing Railway)
app.get("/", (req, res) => {
  res.send("API is running...");
});


module.exports = app;