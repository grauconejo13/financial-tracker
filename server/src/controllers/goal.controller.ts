import { Response } from "express";
import mongoose from "mongoose";
import { Goal } from "../models/Goal.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { logAccountabilityEvent } from "../utils/accountability";

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });
    const { name, targetAmount, deadline, templateType, fields } = req.body;

    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const goal = new Goal({
      user: new mongoose.Types.ObjectId(userId),
      name,
      targetAmount,
      contributedAmount: 0,
      deadline,
      templateType: templateType || null,
      fields: fields || []
    });

    await goal.save();
    await logAccountabilityEvent({
      userId,
      action: "goal_create",
      entityType: "goal",
      entityId: goal._id,
      reason: "Created savings goal",
      detail: {
        created: {
          name: goal.name,
          targetAmount: goal.targetAmount,
          deadline: goal.deadline,
          templateType: goal.templateType,
        },
      },
    });

    res.status(201).json({
      message: "Goal created successfully",
      goal
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create goal" });
  }
};

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });
    const goals = await Goal.find({ user: userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch goals" });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });
    const { id } = req.params;
    const { name, targetAmount, deadline } = req.body;

    const goal = await Goal.findOne({ _id: id, user: userId });

    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const before = {
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline,
    };

    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (deadline !== undefined) goal.deadline = deadline;
    await goal.save();

    await logAccountabilityEvent({
      userId,
      action: "goal_edit",
      entityType: "goal",
      entityId: goal._id,
      reason: "Updated savings goal",
      detail: {
        before,
        after: {
          name: goal.name,
          targetAmount: goal.targetAmount,
          deadline: goal.deadline,
        },
      },
    });

    res.json({ message: "Goal updated successfully", goal });
  } catch (error) {
    res.status(500).json({ message: "Failed to update goal" });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });
    const { id } = req.params;
    const goal = await Goal.findOneAndDelete({ _id: id, user: userId });

    if (!goal) return res.status(404).json({ message: "Goal not found" });

    await logAccountabilityEvent({
      userId,
      action: "goal_delete",
      entityType: "goal",
      entityId: goal._id,
      reason: "Deleted savings goal",
      detail: {
        deleted: {
          name: goal.name,
          targetAmount: goal.targetAmount,
          contributedAmount: goal.contributedAmount,
          deadline: goal.deadline,
        },
      },
    });

    res.json({ message: "Goal deleted successfully", goal });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete goal" });
  }
};

export const contributeToGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Contribution amount must be greater than 0" });
    }

    const goal = await Goal.findOne({ _id: id, user: userId });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const previous = goal.contributedAmount || 0;
    const newContributed = (goal.contributedAmount || 0) + Number(amount);
    if (newContributed > goal.targetAmount) {
      return res.status(400).json({ message: "Contribution exceeds target amount" });
    }

    goal.contributedAmount = newContributed;
    await goal.save();

    await logAccountabilityEvent({
      userId,
      action: "goal_contribution",
      entityType: "goal",
      entityId: goal._id,
      reason: "Contributed to savings goal",
      detail: {
        contribution: {
          amount: Number(amount),
          previousContributedAmount: previous,
          newContributedAmount: goal.contributedAmount,
          targetAmount: goal.targetAmount,
        },
      },
    });

    res.json({ message: "Contribution added successfully", goal });
  } catch (error) {
    res.status(500).json({ message: "Failed to contribute to goal" });
  }
};