import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getGhostOverview } from "../controllers/ghost.controller";

const router = Router();

router.get("/overview", authenticate, getGhostOverview);

export default router;
