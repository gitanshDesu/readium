import { Router } from "express";
import { router as authRouter } from "@readium/auth/authRouter";
import { userRouter } from "./user.route";
import { blogRouter } from "./blog.route";
import { commentRouter } from "./comment.route";
import { dashboardRouter } from "./dashboard.route";
import { followingRouter } from "./following.route";
import { likeRouter } from "./like.route";
import { replyRouter } from "./reply.route";
import { searchRouter } from "./search.route";
import { tagRouter } from "./tag.route";

const router: Router = Router();

router.use("/auth", authRouter);

router.use("/user", userRouter);

router.use("/blog", blogRouter);

router.use("/comment", commentRouter);

router.use("/dashboard", dashboardRouter);

router.use("/following", followingRouter);

router.use("/like", likeRouter);

router.use("/reply", replyRouter);

router.use("/search", searchRouter);

router.use("/tag", tagRouter);

export { router };
