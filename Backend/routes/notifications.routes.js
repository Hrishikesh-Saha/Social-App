import express from "express";

import { protectRoute } from "../middleware/portectRoute.js";
import { deleteNotification, getNotifications } from "../controllers/notifications.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications)
router.delete("/", protectRoute, deleteNotification)

export default router;