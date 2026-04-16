import mongoose from "mongoose";

const savingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  balance: {
    type: Number,
    default: 0
  }
});

export const Savings = mongoose.model("Savings", savingsSchema);
