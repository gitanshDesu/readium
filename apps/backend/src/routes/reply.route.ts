import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  createReply,
  deleteReply,
  editReply,
  getAllReplies,
} from "../controllers/reply.controller";

const router: Router = Router();

router.route("/create").post(isLoggedIn, createReply);

router.route("/get-replies").get(isLoggedIn, getAllReplies);

router.route("/edit/:replyId").patch(isLoggedIn, editReply);

router.route("/delete/:replyId").delete(isLoggedIn, deleteReply);

export { router as replyRouter };
