import { loginUser, registerUser } from "@readium/auth/registerUser";
import { Router } from "express";

const router: Router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

export { router };
