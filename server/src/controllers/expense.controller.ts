import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { Expense } from "../models/expense.model";
import { Transaction } from "../models/Transaction.model";
import { expenseCategories } from "../models/expenseCategories";
import { Category } from "../models/Category.model";
import { logAccountabilityEvent } from "../utils/accountability";

//let expenses: Expense[] = [];

// Add expense
export const addExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    const { amount, category, classification, reason, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required." });
    }

    if (!category) {
      return res.status(400).json({ message: "Category is required." });
    }

    if(!classification){
      return res.status(400).json({message: "Classification is required"});
    }

    const hasPresetCategory = expenseCategories.includes(category);
    const hasUserCategory = await Category.exists({
      user: userId,
      type: "expense",
      name: category,
    });
    if (!hasPresetCategory && !hasUserCategory) {
      return res.status(400).json({ message: "Invalid category." });
    }

    if (!["Necessary", "Avoidable"].includes(classification)){
      return res.status(400).json({ message: "Invalid classification"});
    }

    if (!reason) {
      return res.status(400).json({ message: "Reason is required." });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const newExpense = new Expense ({
      user: new mongoose.Types.ObjectId(userId),
      amount,
      category,
      classification,
      reason,
      date,
    });

    await newExpense.save();

    await Transaction.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        sourceType: "expense",
        sourceId: newExpense._id
      },
      {
        $set: {
          type: "expense",
          amount: Number(newExpense.amount),
          description: String(newExpense.reason || "Expense"),
          category: newExpense.category,
          createdAt: new Date(newExpense.date)
        },
        $setOnInsert: {
          user: new mongoose.Types.ObjectId(userId),
          sourceType: "expense",
          sourceId: newExpense._id
        }
      },
      { upsert: true, new: true }
    );

    await logAccountabilityEvent({
      userId,
      action: "expense_create",
      entityType: "expense",
      entityId: newExpense._id,
      reason: "Added expense",
      detail: {
        created: {
          amount: newExpense.amount,
          category: newExpense.category,
          classification: newExpense.classification,
          reason: newExpense.reason,
          date: newExpense.date,
        }
      }
    });

    res.status(201).json({
      message: "Expense added successfully",
      expense: newExpense,
    });

  } catch (error) {
  console.error("Error adding expense: ", error);
  res.status(500).json({ message: "Failed to add expense" });
  }
};

  

// View expenses
export const viewExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    const expenses = await Expense.find({ user: userId }).sort({ date: -1, createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};


// Edit expense
export const editExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    const { id } = req.params;
    const { amount, category, classification, reason, date } = req.body;

    if (category) {
      const hasPresetCategory = expenseCategories.includes(category);
      const hasUserCategory = await Category.exists({
        user: userId,
        type: "expense",
        name: category,
      });
      if (!hasPresetCategory && !hasUserCategory) {
        return res.status(400).json({ message: "Invalid category." });
      }
    }

    if (classification && !["Necessary", "Avoidable"].includes(classification)){
      return res.status(400).json({message: "Invalid classification"});
    }

    const existingExpense = await Expense.findOne({ _id: id, user: userId });
    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    const before = {
      amount: existingExpense.amount,
      category: existingExpense.category,
      classification: existingExpense.classification,
      reason: existingExpense.reason,
      date: existingExpense.date,
    };

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, user: userId },
      { amount, category, classification, reason, date },
      { new: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    await Transaction.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        sourceType: "expense",
        sourceId: updatedExpense._id
      },
      {
        $set: {
          type: "expense",
          amount: Number(updatedExpense.amount),
          description: String(updatedExpense.reason || "Expense"),
          category: updatedExpense.category,
          createdAt: new Date(updatedExpense.date)
        },
        $setOnInsert: {
          user: new mongoose.Types.ObjectId(userId),
          sourceType: "expense",
          sourceId: updatedExpense._id
        }
      },
      { upsert: true, new: true }
    );

    await logAccountabilityEvent({
      userId,
      action: "expense_edit",
      entityType: "expense",
      entityId: updatedExpense._id,
      reason: "Updated expense",
      detail: {
        before,
        after: {
          amount: updatedExpense.amount,
          category: updatedExpense.category,
          classification: updatedExpense.classification,
          reason: updatedExpense.reason,
          date: updatedExpense.date,
        }
      }
    });

    res.json({
      message: "Expense updated successfully",
      expense: updatedExpense,
    });

  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Failed to update expense" });
  }
};


// Delete expense
export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    const { id } = req.params;

    const deletedExpense = await Expense.findOneAndDelete({ _id: id, user: userId });

    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    await Transaction.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        sourceType: "expense",
        sourceId: deletedExpense._id
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new mongoose.Types.ObjectId(userId),
          deleteReason: "Deleted from Expense page"
        }
      }
    );

    await logAccountabilityEvent({
      userId,
      action: "expense_delete",
      entityType: "expense",
      entityId: deletedExpense._id,
      reason: "Deleted expense",
      detail: {
        deleted: {
          amount: deletedExpense.amount,
          category: deletedExpense.category,
          classification: deletedExpense.classification,
          reason: deletedExpense.reason,
          date: deletedExpense.date,
        }
      }
    });

    res.json({
      message: "Expense deleted successfully",
      expense: deletedExpense,
    });

  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
};
