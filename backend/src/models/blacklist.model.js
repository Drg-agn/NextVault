const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: [true, "Token is required to blacklist"],
            unique: true // ✅ unique doesn't accept array in Mongoose
        },
        blacklistedAt: {
            type: Date,
            default: Date.now, // ✅ was: Data.now (typo)
            immutable: true
        }
    },
    {
        timestamps: true
    }
);

// ✅ Fixed: missing comma between index fields object and options object
tokenBlacklistSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 3 } // ✅ was: expiredAfterSeconds (wrong key)
);

// ✅ Fixed: was tokenBlackListSchema (wrong case) — must match the defined variable name
const tokenBlacklistModel = mongoose.model("tokenBlackList", tokenBlacklistSchema);

module.exports = tokenBlacklistModel;