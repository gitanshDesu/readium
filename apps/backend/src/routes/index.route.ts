import { Router } from "express";
import { router as authRouter } from "./auth.route";

const router: Router = Router();

router.use("/auth", authRouter);

export { router };
