const jwt  = require("jsonwebtoken");
const User = require("../models/User");
/**
 * Protect middleware — attaches req.user if valid Bearer token present.
 */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided. Please log in." });
    }

    const token   = header.split(" ")[1]; // get the tokenpart  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password"); // do not get password  
    if (!user) {
      return res.status(401).json({ error: "User no longer exists. Please log in again." });
    }

    req.user = user; // assing  the user to the re object  
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token. Please log in." });
  }
};

module.exports = { protect };