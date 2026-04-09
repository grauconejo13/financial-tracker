import express from "express";
import { User } from "../models/User.model";
import { Transaction } from "../models/Transaction.model";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // Active = updated in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await User.countDocuments({
      updatedAt: { $gte: sevenDaysAgo },
    });

    const totalTransactions = await Transaction.countDocuments({
      isDeleted: false,
    });

    res.json({
      totalUsers,
      activeUsers,
      totalTransactions,
      status: "Active",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
