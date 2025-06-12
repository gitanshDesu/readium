import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import {
  deleteUserAccount,
  getAllUserBlogs,
  getUserBlogHistory,
  getUserBookmarks,
  updateAccountDetails,
  updateAvatar,
} from "../controllers/user.controller";
import { upload } from "@readium/middleware/multer";

const router: Router = Router();

router.route("/blogs").get(isLoggedIn, getAllUserBlogs);

router.route("/edit").patch(isLoggedIn, updateAccountDetails);

router
  .route("/edit-avatar")
  .patch(isLoggedIn, upload.single("avatar"), updateAvatar);

router.route("/delete").delete(isLoggedIn, deleteUserAccount);

router.route("/bookmarks").get(isLoggedIn, getUserBookmarks);

router.route("/blogHistory").get(isLoggedIn, getUserBlogHistory);

export { router as userRouter };
