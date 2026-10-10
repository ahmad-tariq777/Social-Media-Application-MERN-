import Notification from "../models/Notification.js";
import { emitToUser } from "./socketStore.js";

export const notify = async ({ recipient, sender, type, post, reel, comment, text }) => {
  try {
    if (!recipient || String(recipient) === String(sender)) return null;
    const filter = { recipient, sender, type, post: post || null, reel: reel || null, comment: comment || null };
    if (["like", "commentLike", "follow", "followRequest"].includes(type)) {
      const existing = await Notification.findOne(filter);
      if (existing) return existing;
    }
    const created = await Notification.create({ ...filter, text: text || "" });
    const populated = await created.populate("sender", "username name profilePic isVerified");
    emitToUser(recipient, "notification", populated);
    return populated;
  } catch (err) {
    console.error("Notification failed:", err.message);
    return null;
  }
};

export const removeNotification = async (filter) => {
  try {
    await Notification.deleteMany(filter);
  } catch (err) {
    console.error("Notification cleanup failed:", err.message);
  }
};
