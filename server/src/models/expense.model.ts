import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  classification: {
    type: String,
    enum: ["Necessary", "Avoidable"],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

export const Expense = mongoose.model("Expense", expenseSchema);

