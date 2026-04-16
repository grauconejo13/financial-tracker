 import { Response } from "express";
 import mongoose from "mongoose";
 import Income from "../models/income.model";
import { Transaction } from "../models/Transaction.model";
 import { AuthRequest } from "../middleware/auth.middleware";
import { logAccountabilityEvent } from "../utils/accountability";

 // Add income
export const addIncome = async(req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthenticated" });
        }
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

        const newIncome = new Income({
            user: new mongoose.Types.ObjectId(userId),
            amount,
            reason,
            date
        });

        await newIncome.save();

        const occurredAt = new Date(newIncome.date);
        await Transaction.findOneAndUpdate(
          {
            user: new mongoose.Types.ObjectId(userId),
            sourceType: "income",
            sourceId: newIncome._id
          },
          {
            $set: {
              type: "income",
              amount: Number(newIncome.amount),
              description: String(newIncome.reason || "Income"),
              category: undefined,
              createdAt: occurredAt
            },
            $setOnInsert: {
              user: new mongoose.Types.ObjectId(userId),
              sourceType: "income",
              sourceId: newIncome._id
            }
          },
          { upsert: true, new: true }
        );

        await logAccountabilityEvent({
            userId,
            action: "income_create",
            entityType: "income",
            entityId: newIncome._id,
            reason: "Added income",
            detail: {
                created: {
                    amount: newIncome.amount,
                    reason: newIncome.reason,
                    date: newIncome.date
                }
            }
        });

        res.status(201).json({
            message: "Income added successfully",
            income: newIncome
        });
    } catch (error) {
        console.error("Error adding income: ", error);
        res.status(500).json({ message: "Failed to add income" });
    }
};

  // Get income
  export const getIncomes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    const incomes = await Income.find({ user: userId }).sort({ date: -1, createdAt: -1 });  
    res.status(200).json(incomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    res.status(500).json({ message: "Failed to fetch incomes" });
  }
};

// Edit income
export const editIncome = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    const { id } = req.params;
    const { amount, reason, date } = req.body;

    const existingIncome = await Income.findOne({ _id: id, user: userId });
    if (!existingIncome) {
      return res.status(404).json({ message: "Income not found" });
    }

    const before = {
      amount: existingIncome.amount,
      reason: existingIncome.reason,
      date: existingIncome.date
    };

    const updatedIncome = await Income.findOneAndUpdate(
      { _id: id, user: userId },
      { amount, reason, date },
      { new: true }
    );

    if (!updatedIncome) {
      return res.status(404).json({ message: "Income not found" });
    }

    await Transaction.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        sourceType: "income",
        sourceId: updatedIncome._id
      },
      {
        $set: {
          type: "income",
          amount: Number(updatedIncome.amount),
          description: String(updatedIncome.reason || "Income"),
          category: undefined,
          createdAt: new Date(updatedIncome.date)
        },
        $setOnInsert: {
          user: new mongoose.Types.ObjectId(userId),
          sourceType: "income",
          sourceId: updatedIncome._id
        }
      },
      { upsert: true, new: true }
    );

    await logAccountabilityEvent({
      userId,
      action: "income_edit",
      entityType: "income",
      entityId: updatedIncome._id,
      reason: "Updated income",
      detail: {
        before,
        after: {
          amount: updatedIncome.amount,
          reason: updatedIncome.reason,
          date: updatedIncome.date
        }
      }
    });

    res.status(200).json({
      message: "Income updated successfully",
      income: updatedIncome
    });

  } catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({ message: "Failed to update income" });
  }
};


// Delete income
export const deleteIncome = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    const { id } = req.params;

    const deletedIncome = await Income.findOneAndDelete({ _id: id, user: userId });

    if (!deletedIncome) {
      return res.status(404).json({ message: "Income not found" });
    }

    await Transaction.findOneAndUpdate(
      {
        user: new mongoose.Types.ObjectId(userId),
        sourceType: "income",
        sourceId: deletedIncome._id
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new mongoose.Types.ObjectId(userId),
          deleteReason: "Deleted from Income page"
        }
      }
    );

    await logAccountabilityEvent({
      userId,
      action: "income_delete",
      entityType: "income",
      entityId: deletedIncome._id,
      reason: "Deleted income",
      detail: {
        deleted: {
          amount: deletedIncome.amount,
          reason: deletedIncome.reason,
          date: deletedIncome.date
        }
      }
    });

    res.status(200).json({
      message: "Income deleted successfully",
      income: deletedIncome
    });

  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({ message: "Failed to delete income" });
  }
};