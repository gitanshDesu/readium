import { Router } from "express";
import {
  loginUser,
  loginViaGoogleHandler,
  LogoutHandler,
  registerUser,
  resetPasswordHandler,
  verifyEmailHandler,
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

router.route("/verify-email").post(isLoggedIn, verifyEmailHandler);
router.route("forgot-password").post(isLoggedIn, resetPasswordHandler);
router.route("logout").post(isLoggedIn, LogoutHandler);

export { router };
