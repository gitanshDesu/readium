import { Router } from "express";
import {
  loginUser,
  loginViaGoogleHandler,
  registerUser,
} from "../controller/auth.controller";
import passport from "../middleware/passport.middleware";

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

export { router };
