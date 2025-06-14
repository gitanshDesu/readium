import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  getAllFollowers,
  getFollowedUsers,
  ToggleFollow,
} from "../controllers/following.controller";

const router: Router = Router();

router.route("/toggle-follow/:authorId").post(isLoggedIn, ToggleFollow);

router.route("/my-followers").get(isLoggedIn, getAllFollowers);

router.route("/me-following").get(isLoggedIn, getFollowedUsers);

export { router as followingRouter };
