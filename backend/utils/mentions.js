import User from "../models/User.js";
import { extractMentions } from "./text.js";
import { notify } from "./notify.js";

export const resolveMentions = async (text, excludeId) => {
  const names = extractMentions(text);
  if (!names.length) return [];
  const users = await User.find({ username: { $in: names }, _id: { $ne: excludeId } }).select("_id");
  return users.map((u) => u._id);
};

export const notifyMentions = async ({ users, sender, post, reel, comment }) => {
  await Promise.all(users.map((recipient) => notify({ recipient, sender, type: "mention", post, reel, comment })));
};
