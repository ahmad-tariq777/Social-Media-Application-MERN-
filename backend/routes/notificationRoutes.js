import express from "express";
import auth from "../middlewares/authMiddleware.js";
import validateId from "../middlewares/validateId.js";
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  clearNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(auth);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllRead);
router.delete("/", clearNotifications);
router.put("/:id/read", validateId("id"), markRead);
router.delete("/:id", validateId("id"), deleteNotification);

export default router;
