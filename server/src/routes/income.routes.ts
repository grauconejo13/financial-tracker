import { Router } from "express";
import { addIncome, editIncome, deleteIncome, getIncomes } from "../controllers/income.controller"; 
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getIncomes);
router.post("/", authenticate, addIncome);
router.put("/:id", authenticate, editIncome);
router.delete("/:id", authenticate, deleteIncome);

export default router;