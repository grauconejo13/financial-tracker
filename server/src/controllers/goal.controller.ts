import { Request, Response } from "express";
import { Goal } from "../models/Goal.model";

export const createGoal = async (req: Request, res: Response) => {
  try {
    const { name, targetAmount, deadline, templateType, fields } = req.body;

    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const goal = new Goal({
      name,
      targetAmount,
      contributedAmount: 0,
      deadline,
      templateType: templateType || null,
      fields: fields || []
    });

    await goal.save();

    res.status(201).json({
      message: "Goal created successfully",
      goal
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create goal" });
  }
};

export const getGoals = async (req: Request, res: Response) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch goals" });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, targetAmount, deadline } = req.body;

    const goal = await Goal.findByIdAndUpdate(
      id,
      { name, targetAmount, deadline },
      { new: true }
    );

    if (!goal) return res.status(404).json({ message: "Goal not found" });

    res.json({ message: "Goal updated successfully", goal });
  } catch (error) {
    res.status(500).json({ message: "Failed to update goal" });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findByIdAndDelete(id);

    if (!goal) return res.status(404).json({ message: "Goal not found" });

    res.json({ message: "Goal deleted successfully", goal });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete goal" });
  }
};

export const contributeToGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Contribution amount must be greater than 0" });
    }

    const goal = await Goal.findById(id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const newContributed = (goal.contributedAmount || 0) + Number(amount);
    if (newContributed > goal.targetAmount) {
      return res.status(400).json({ message: "Contribution exceeds target amount" });
    }

    goal.contributedAmount = newContributed;
    await goal.save();

    res.json({ message: "Contribution added successfully", goal });
  } catch (error) {
    res.status(500).json({ message: "Failed to contribute to goal" });
  }
};