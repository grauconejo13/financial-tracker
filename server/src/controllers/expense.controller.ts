import { Request, Response } from "express";
import { Expense } from "../models/expense.model";
import { expenseCategories } from "../models/expenseCategories";

let expenses: Expense[] = [];

// Add expense
export const addExpense = (req: Request, res: Response) => {
  const { amount, category, reason, date } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid amount is required." });
  }

  if (!category) {
    return res.status(400).json({ message: "Category is required." });
  }

  if (!expenseCategories.includes(category)) {
    return res.status(400).json({ message: "Invalid category." });
  }

  if (!reason) {
    return res.status(400).json({ message: "Reason is required." });
  }

  if (!date) {
    return res.status(400).json({ message: "Date is required." });
  }

  const newExpense: Expense = {
    id: Date.now(),
    amount,
    category,
    reason,
    date,
  };

  expenses.push(newExpense);

  res.status(201).json({
    message: "Expense added successfully",
    expense: newExpense,
  });
};

// View expenses
export const viewExpenses = (req: Request, res: Response) => {
  res.status(200).json(expenses);
};


// Edit expense
export const editExpense = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { amount, category, reason, date } = req.body;

  const expense = expenses.find((e) => e.id === id);

  if (!expense) {
    return res.status(404).json({ message: "Expense not found." });
  }

  if (amount !== undefined) {
    if (amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required." });
    }
    expense.amount = amount;
  }

  if (category !== undefined) {
    if (!expenseCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category." });
    }
    expense.category = category;
  }

  if (reason !== undefined) {
    expense.reason = reason;
  }

  if (date !== undefined) {
    expense.date = date;
  }

  res.json({
    message: "Expense updated successfully",
    expense,
  });
};


// Delete expense
export const deleteExpense = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const index = expenses.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Expense not found." });
  }

  const deletedExpense = expenses.splice(index, 1);

  res.json({
    message: "Expense deleted successfully",
    expense: deletedExpense[0],
  });
};
