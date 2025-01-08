import express from "express";

import { getUserProfile, followUnfollowUser, getSuggestedUsers, updateUser } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/portectRoute.js";

const router = express.Router();

router.get("/profile/:userName", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/update", protectRoute, updateUser)

export default router;
