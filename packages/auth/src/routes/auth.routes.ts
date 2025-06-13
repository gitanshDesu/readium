import { Router } from "express";
import {
  forgotPasswordHandler,
  loginUser,
  loginViaGoogleHandler,
  LogoutHandler,
  refershAccessTokenHandler,
  registerUser,
  resetPasswordHandler,
  verifyEmailHandler,
} from "../controller/auth.controller";
import passport from "../config/passport.config";
import { isLoggedIn } from "../middleware/auth.middleware";
import { upload } from "@readium/middleware/multer";
const router: Router = Router();

router.route("/register").post(upload.single("avatar"), registerUser);
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
router.route("/forgot-password").post(isLoggedIn, forgotPasswordHandler);
router.route("/reset-password").patch(isLoggedIn, resetPasswordHandler);
router.route("/logout").post(isLoggedIn, LogoutHandler);
router.route("/refresh-token").post(refershAccessTokenHandler); //doesn't require isLoggedIn as we are doing jwt.verify inside controller

export { router };
