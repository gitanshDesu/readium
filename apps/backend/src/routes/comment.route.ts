import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  createComment,
  deleteComment,
  editComment,
  getAllComments,
} from "../controllers/comment.controller";

const router: Router = Router();

router.route("/create").post(isLoggedIn, createComment);

router.route("/get-comments").get(isLoggedIn, getAllComments);

router.route("/edit/:commentId").patch(isLoggedIn, editComment);

router.route("/delete/:commentId").delete(isLoggedIn, deleteComment);

export { router as commentRouter };
