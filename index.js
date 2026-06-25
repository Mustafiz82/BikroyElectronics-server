import express from "express";
import { connectDB } from "./config/db.js";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

import { stripeWebhookHandler } from "./controllers/orderController.js";
import { setJwtToken } from "./controllers/userController.js";
import { verifyToken } from "./middleware/authMiddleware.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://bikroyelectronics.web.app"],
    credentials: true,
  }),
);

app.post(
  "/webhooks",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.post("/jwt", setJwtToken);
app.use("/users", userRoutes);
app.use("/", productRoutes);
app.use("/", categoryRoutes);
app.use("/", verifyToken, wishlistRoutes);
app.use("/", verifyToken, cartRoutes);
app.use("/", orderRoutes);

app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

await connectDB(process.env.MONGODB_URI);

let isConnected = false;
app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectDB(process.env.MONGODB_URI);
    isConnected = true;
  }
  next();
});

// if (mongoose.connection.readyState === 0) {
//     await connectDB(process.env.MONGODB_URI);
// }

app.listen(3000, () => {
  console.log("server running on localhost 3000");
});

export default app;

// later steps

// isloogedin in db usermodel remove after jwt
// impleten token validaiton
