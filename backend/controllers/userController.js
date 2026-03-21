const User    = require("../models/User");
const Attempt = require("../models/Attempt");

// GET /api/users/profile
exports.getProfile = async (req, res) => { // fetch user details
  try {
    const user = await User.findById(req.user._id);
    const attempts = await Attempt.find({ user: req.user._id, status: "evaluated" })
      .sort({ createdAt: 1 }) // sort in ascending order of creation time (oldest first)
      .limit(20)
      .select("score problemTitle createdAt timeTaken weakAreas"); // select only this field from the attempt list

    res.json({
      user: {
        id:        user._id,
        username:  user.username,
        email:     user.email,
        stats:     user.stats,
        weakAreas: user.weakAreas,
        createdAt: user.createdAt,
      },
      attempts,
    });
  } catch (err) {
    console.error("getProfile:", err);
    res.status(500).json({ error: "Failed to load profile." });
  }
};

// PATCH /api/users/profile
exports.updateProfile = async (req, res) => {  // — update username
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters." });
    }

    const taken = await User.findOne({ username: username.trim(), _id: { $ne: req.user._id } }); // do not match with any other username that already present
    if (taken) return res.status(400).json({ error: "Username already taken." });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username: username.trim() },
      { new: true, runValidators: true }
    );

    res.json({
      user: { id: user._id, username: user.username, email: user.email, stats: user.stats, weakAreas: user.weakAreas },
    });
  } catch (err) {
    console.error("updateProfile:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
};

// PATCH /api/users/password
exports.updatePassword = async (req, res) => { // for updating the password
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) { // match the current password with the one in database
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("updatePassword:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
};