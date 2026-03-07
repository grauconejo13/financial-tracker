 import { Request, Response } from "express";
 import Income from "../models/income.model";

 // Add income
export const addIncome = (req: Request, res: Response) => {
  const { amount, reason, date } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid amount required" });
  }

  if (!reason) {
    return res.status(400).json({ message: "Reason is required" });
  }

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  // Temporary in-memory storage
  const newIncome = { id: Date.now(), amount, reason, date };
  
  
  // Push to SQL 
  console.log("Income added:", newIncome);

  res.status(201).json({ message: "Income added successfully", income: newIncome });
};

  // Get income
  export const getIncomes = async (req: Request, res: Response) => {
  try {
    const incomes = await Income.find();  
    res.status(200).json(incomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    res.status(500).json({ message: "Failed to fetch incomes" });
  }
};
