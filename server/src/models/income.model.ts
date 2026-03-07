import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  source: { type: String, required: true },    
  amount: { type: Number, required: true },
  category: { type: String },                 
  date: { type: Date, required: true }
});

const Income = mongoose.model("Income", incomeSchema);
export default Income;