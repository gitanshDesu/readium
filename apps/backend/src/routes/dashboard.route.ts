import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  getAnotherUserProfileStats,
  getUserProfileStats,
} from "../controllers/dashboard.controller";

const router: Router = Router();

router.route("/my-stats").get(isLoggedIn, getUserProfileStats);

router.route("/author-stats").get(isLoggedIn, getAnotherUserProfileStats);

export { router as dashboardRouter };
