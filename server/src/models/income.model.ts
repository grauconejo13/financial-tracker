import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  amount: { type: Number, required: true },
  reason: { type: String },                 
  date: { type: Date, required: true }
}, { timestamps: true });

const Income = mongoose.model("Income", incomeSchema);
export default Income;