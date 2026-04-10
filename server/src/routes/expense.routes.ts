import express from "express";
import { addExpense, viewExpenses, editExpense, deleteExpense } from "..//controllers/expense.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/", authenticate, addExpense);
router.get("/", authenticate, viewExpenses);
router.put("/:id", authenticate, editExpense);
router.delete("/:id", authenticate, deleteExpense);

export default router;