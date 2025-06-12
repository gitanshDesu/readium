import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  createTag,
  deleteTag,
  editTag,
  getAllTags,
} from "../controllers/tag.controller";

const router: Router = Router();

router.route("/create").post(isLoggedIn, createTag);

router.route("/").get(isLoggedIn, getAllTags);

router.route("/edit/:tagId").patch(isLoggedIn, editTag);

router.route("/delete/:tagId").delete(isLoggedIn, deleteTag);

export { router as tagRouter };
