import { Router } from "express";
import {
  loginUser,
  loginViaGoogleHandler,
  LogoutHandler,
  registerUser,
} from "../controller/auth.controller";
import passport from "../config/passport.config";
import { isLoggedIn } from "../middleware/auth.middleware";

const router: Router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/login/google").get(
  passport.authenticate("google", {
    scope: ["openid", "profile", "email"],
  })
);
router
  .route("/google/callback")
  .get(passport.authenticate("google"), loginViaGoogleHandler);

router.route("/verify-email").post();
router.route("forgot-password").post();
router.route("logout").post(isLoggedIn, LogoutHandler);

export { router };
