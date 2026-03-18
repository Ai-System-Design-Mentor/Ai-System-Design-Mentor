require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const mongoose   = require("mongoose");
const rateLimit  = require("express-rate-limit");
const authRoutes    = require("./routes/auth");
const userRoutes    = require("./routes/users");

const app=express();
app.use(express.json({ limit: "3mb" }));

app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
//console.log("URI:", process.env.MONGODB_URI);
// connect to mongoDb 
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });