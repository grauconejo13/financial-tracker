import { Router } from "express";
import { createGoal, getGoals, updateGoal, deleteGoal, contributeToGoal } from "../controllers/goal.controller";

const router = Router();

router.get("/", getGoals);
router.post("/", createGoal);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);
router.post("/:id/contribute", contributeToGoal);

export default router;