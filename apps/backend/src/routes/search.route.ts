import { isLoggedIn } from "@readium/auth/isLoggedIn";
import { Router } from "express";
import { getAllSuchBlogs } from "../controllers/search.controller";

const router: Router = Router();

router.route("/blogs").get(isLoggedIn, getAllSuchBlogs);

export { router as searchRouter };
