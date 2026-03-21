const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters"],
            maxlength: [30, "Username cannot exceed 30 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        stats: {
            totalAttempts: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0.0 },
            bestScore: { type: Number, default: 0.0 },
            totalScore: { type: Number, default: 0.0 }, // running sum for average
        },
        weakAreas: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); // if not modified skip hasing
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare plain password against hash
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// Recalculate and persist stats after each new attempt
userSchema.methods.updateStats = async function (newScore) {
    this.stats.totalAttempts += 1;
    this.stats.totalScore += newScore;
    this.stats.averageScore = parseFloat(
        (this.stats.totalScore / this.stats.totalAttempts).toFixed(2)
    );
    if (newScore > this.stats.bestScore) this.stats.bestScore = newScore;
    await this.save();
};

module.exports = mongoose.model("User", userSchema);