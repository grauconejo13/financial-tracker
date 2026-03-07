import { Router } from "express";
import { addIncome } from "../controllers/income.controller"; 
import { getIncomes} from "../controllers/income.controller"

const router = Router();

router.get("/", getIncomes);
router.post("/", addIncome);

export default router;