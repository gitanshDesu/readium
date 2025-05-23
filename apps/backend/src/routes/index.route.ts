import { Router } from "express";
import { router as authRouter } from "@readium/auth/authRouter";

const router: Router = Router();

router.use("/auth", authRouter);

export { router };
