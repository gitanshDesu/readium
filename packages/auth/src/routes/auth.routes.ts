import { Router } from "express";
import {
  loginUser,
  loginViaGoogleHandler,
  registerUser,
} from "../controller/auth.controller";
import passport from "passport";

const router: Router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/login/google").get(passport.authenticate("google"));
router.route("/google/callback").get(loginViaGoogleHandler);

export { router };
