import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  toggleBlogLike,
  toggleCommentLike,
  toggleReplyLike,
} from "../controllers/like.controller";

const router: Router = Router();

router.route("/like-blog/:blogId").post(isLoggedIn, toggleBlogLike);

router.route("/like-comment/:commentId").post(isLoggedIn, toggleCommentLike);

router.route("/like-reply/:replyId").post(isLoggedIn, toggleReplyLike);

export { router as likeRouter };
