const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlacklistModel = require("../models/blacklist.model");
const accountModel = require("../models/account.model"); // ✅ add this

/* ================= REGISTER ================= */
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const isExists = await userModel.findOne({ email });

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with this email",
                status: "failed"
            });
        }

        const user = await userModel.create({ email, password, name });

        // ✅ Auto create bank account after registration
        const account = await accountModel.create({
            user: user._id
        });

        emailService
            .sendRegistrationEmail(user.email, user.name)
            .catch(err => console.error("Email error:", err));

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false
        });

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            account, // ✅ send account in response too
            token
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

/* ================= LOGIN ================= */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "Email or password is INVALID"
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is INVALID"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false
        });

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

/* ================= LOGOUT ================= */
async function userLogoutController(req, res) {
    try {
        const token =
            req.cookies.token ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(400).json({
                message: "No token provided"
            });
        }

        res.cookie("token", "", { httpOnly: true, expires: new Date(0) });

        await tokenBlacklistModel.create({ token });

        return res.status(200).json({
            message: "User logged out successfully"
        });

    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};