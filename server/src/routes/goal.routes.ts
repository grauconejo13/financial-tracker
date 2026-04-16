import { Router } from "express";
import { createGoal, getGoals, updateGoal, deleteGoal, contributeToGoal } from "../controllers/goal.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getGoals);
router.post("/", authenticate, createGoal);
router.put("/:id", authenticate, updateGoal);
router.delete("/:id", authenticate, deleteGoal);
router.post("/:id/contribute", authenticate, contributeToGoal);

export default router;