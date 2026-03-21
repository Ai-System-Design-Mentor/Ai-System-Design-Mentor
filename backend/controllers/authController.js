const jwt = require("jsonwebtoken");
const User = require("../models/User");

// creating the token
const sign = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });


// only provide essential user information
const publicUser = (u) => ({
    id: u._id,
    username: u.username,
    email: u.email,
    stats: u.stats,
    weakAreas: u.weakAreas,
    createdAt: u.createdAt,
});

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        if (await User.findOne({ email: email.toLowerCase() })) {
            return res.status(400).json({ error: "Email already registered." });
        }
        if (await User.findOne({ username })) {
            return res.status(400).json({ error: "Username already taken." });
        }

        const user = await User.create({ username, email, password });
        res.status(201).json({ token: sign(user._id), user: publicUser(user) });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email or username already exists." });
        }
        console.error("register:", err);
        res.status(500).json({ error: "Registration failed. Please try again." });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        res.json({ token: sign(user._id), user: publicUser(user) });
    } catch (err) {
        console.error("login:", err);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ error: "All fields are required." });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters." });
        }

        // ✅ Use .select("+password") to explicitly include password field
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            return res.status(404).json({ error: "No account found with this email." });
        }

        // ✅ Double check password exists before comparing
        if (!user.password) {
            return res.status(500).json({ error: "Account error. Please contact support." });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("forgotPassword error:", err);
        res.status(500).json({ error: "Server error. Please try again." });
    }
};

// GET /api/auth/me
exports.getMe = (req, res) => res.json({ user: publicUser(req.user) });