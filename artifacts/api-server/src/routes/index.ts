import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tripsRouter from "./trips";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(tripsRouter);

export default router;
