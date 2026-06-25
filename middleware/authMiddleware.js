import jwt from "jsonwebtoken";
import User from '../models/User.js'

// 🟢 1. Authentication Middleware (Verifies JWT cookie)
export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log("hit token check request ")

  if (!token) {
    return res.status(401).json({ error: "Access Denied: No Token Provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach { id, email, role } to the request
    next();
  } catch (error) {
    return res.status(403).json({ error: "Access Denied: Invalid or Expired Token" });
  }
};

// 🟢 2. Authorization Middleware (Verifiesp live Database Admin Role)
export const verifyAdmin = async (req, res, next) => {
  try {
    console.log(req.user)
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: "Access Denied: Authentication required" });
    }

    // Fetch the user directly from MongoDB to verify their live role
    const dbUser = await User.findOne({
      email: req.user.email,
    });

    if (!dbUser) {
      return res.status(404).json({ error: "Access Denied: User not found" });
    }

    // Reject if they are not an Admin
    if (dbUser.role !== "admin") {
      return res.status(403).json({ error: "Access Denied: Admin privileges required" });
    }

    next(); // Pass control to the controller
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Internal server error during authorization" });
  }
};  