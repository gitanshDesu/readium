import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  createBlog,
  deleteBlog,
  getBlogById,
  toggleBookMark,
  togglePublish,
  updateBlog,
} from "../controllers/blog.controller";
import { upload } from "@readium/middleware/multer";

const router: Router = Router();

router
  .route("/create")
  .post(isLoggedIn, upload.single("thumbnail"), createBlog);

router.route("/:blogId").get(isLoggedIn, getBlogById);

router
  .route("/edit/:blogId")
  .patch(isLoggedIn, upload.single("thumbnail"), updateBlog);

router.route("/delete/:blogId").delete(isLoggedIn, deleteBlog);

router.route("/toggle-bookmark/:blogId").post(isLoggedIn, toggleBookMark);

router.route("/toggle-publish/:blogId").post(isLoggedIn, togglePublish);

export { router as blogRouter };
