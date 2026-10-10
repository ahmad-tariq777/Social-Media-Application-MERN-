import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { paginate } from "../utils/pagination.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 20, 50);
  const filter = { recipient: req.userId };
  if (req.query.unread === "true") filter.isRead = false;

  const [items, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "username name profilePic isVerified")
      .populate("post", "media imageUrl videoUrl")
      .populate("reel", "videoUrl"),
    Notification.countDocuments({ recipient: req.userId, isRead: false }),
  ]);

  res.json({ notifications: items, unreadCount, page, hasMore: items.length === limit });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ recipient: req.userId, isRead: false });
  res.json({ unreadCount });
});

export const markRead = asyncHandler(async (req, res) => {
  const updated = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.userId }, { isRead: true }, { new: true });
  if (!updated) throw httpError(404, "Notification not found");
  res.json(updated);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.userId, isRead: false }, { isRead: true });
  res.json({ msg: "All notifications marked as read" });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const removed = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.userId });
  if (!removed) throw httpError(404, "Notification not found");
  res.json({ msg: "Notification deleted" });
});

export const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.userId });
  res.json({ msg: "Notifications cleared" });
});
