import express from "express";

import { signup, logIn, logOut, getUser } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/portectRoute.js";

const router = express.Router();

router.get("/user", protectRoute, getUser);
router.post("/signup", signup);
router.post("/login", logIn);
router.post("/logout", logOut);

export default router;
