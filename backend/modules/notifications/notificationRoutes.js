import express from "express";
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead
} from "./notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.post("/", createNotification);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

export default router;
