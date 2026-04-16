import { Router } from "express";
import {
  getSavings,
  addSavings,
  withdrawSavings
} from "../controllers/savings.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getSavings);
router.post("/add", authenticate, addSavings);
router.post("/withdraw", authenticate, withdrawSavings);



export default router;
