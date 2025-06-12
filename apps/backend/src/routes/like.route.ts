import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  toggleBlogLike,
  toggleCommentLike,
  toggleReplyLike,
} from "../controllers/like.controller";

const router: Router = Router();

router.route("/like-blog").post(isLoggedIn, toggleBlogLike);

router.route("/like-comment").post(isLoggedIn, toggleCommentLike);

router.route("/like-reply").post(isLoggedIn, toggleReplyLike);

export { router as likeRouter };
