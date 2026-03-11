import express from "express";
import { addExpense, viewExpenses, editExpense, deleteExpense } from "..//controllers/expense.controller";

const router = express.Router();

router.post("/", addExpense);
router.get("/", viewExpenses);
router.put("/:id", editExpense);
router.delete("/:id", deleteExpense);

export default router;