const axios = require("axios");
const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");

async function chatController(req, res) {
    try {
        const { messages, accountId } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: "messages array is required" });
        }

        // Fetch user context (balance + recent transactions)
        let contextInfo = "";
        if (accountId) {
            const account = await accountModel.findOne({
                _id: accountId,
                user: req.user._id
            });

            if (account) {
                // Compute balance from ledger
                const ledgerEntries = await ledgerModel.find({ account: accountId });
                const balance = ledgerEntries.reduce((acc, entry) => {
                    return entry.type === "CREDIT"
                        ? acc + entry.amount
                        : acc - entry.amount;
                }, 0);

                // Get last 5 transactions
                const recentTx = await transactionModel
                    .find({
                        $or: [{ fromAccount: accountId }, { toAccount: accountId }]
                    })
                    .sort({ createdAt: -1 })
                    .limit(5);

                contextInfo = `
User's current balance: ₹${balance.toFixed(2)}
Recent transactions (last 5):
${recentTx.map(tx => `- ${tx.fromAccount.toString() === accountId ? "Sent" : "Received"} ₹${tx.amount} (${tx.status}) on ${new Date(tx.createdAt).toLocaleDateString()}`).join("\n")}
                `.trim();
            }
        }

        const systemPrompt = `You are NexVault Assistant, a helpful AI for the NexVault banking app.
You help users with:
- Understanding their balance and transactions
- How to send money, add money via Razorpay
- General banking FAQs
- NexVault features like dashboard, transaction history, profile

${contextInfo ? `Here is the current user's account info:\n${contextInfo}` : ""}

Keep responses concise, friendly, and professional. Use ₹ for currency. Never ask for passwords or sensitive info.`;

        // ✅ Groq API call
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                max_tokens: 1024,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const reply = response.data.choices[0].message.content;
        res.status(200).json({ reply });

    } catch (error) {
        console.error("Chat Error:", error?.response?.data || error.message);
        res.status(500).json({ message: "Chat failed. Please try again." });
    }
}

module.exports = { chatController };