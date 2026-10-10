import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { uploadFile, deleteAsset } from "../utils/cloud.js";
import { emitToUser } from "../utils/socketStore.js";
import { USER_FIELDS } from "../utils/access.js";

const populateMessage = (query) =>
  query
    .populate("senderId", USER_FIELDS)
    .populate({ path: "replyTo", select: "text mediaUrl senderId isDeleted", populate: { path: "senderId", select: "username" } })
    .populate("sharedPost", "media imageUrl videoUrl caption userId")
    .populate("sharedReel", "videoUrl caption userId");

const loadChat = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw httpError(404, "Chat not found");
  if (!chat.members.some((m) => String(m) === String(userId))) throw httpError(403, "Not a member of this chat");
  return chat;
};

const clean = (msg) => {
  const obj = msg.toObject ? msg.toObject() : msg;
  if (obj.isDeleted) return { ...obj, text: "", mediaUrl: "", mediaType: "", sharedPost: null, sharedReel: null, reactions: [] };
  return obj;
};

const broadcast = (chat, event, payload, exceptId) => {
  chat.members.forEach((m) => {
    if (String(m) !== String(exceptId)) emitToUser(m, event, payload);
  });
};

export const addMessage = asyncHandler(async (req, res) => {
  const { chatId, text = "", mediaUrl = "", replyTo = null, sharedPost = null, sharedReel = null } = req.body;
  const chat = await loadChat(chatId, req.userId);

  if (!chat.isGroup) {
    const otherId = chat.members.find((m) => String(m) !== String(req.userId));
    const other = await User.findById(otherId).select("blocked");
    if (other?.blocked.some((b) => String(b) === String(req.userId)) || req.user.blocked.some((b) => String(b) === String(otherId))) {
      throw httpError(403, "You cannot message this user");
    }
  }

  let media = { url: mediaUrl, type: mediaUrl ? "image" : "", publicId: "" };
  if (req.file) {
    const uploaded = await uploadFile(req.file, "social_media/chat");
    media = { url: uploaded.url, type: uploaded.type, publicId: uploaded.publicId };
  }

  if (!text.trim() && !media.url && !sharedPost && !sharedReel) throw httpError(400, "Message is empty");

  if (replyTo) {
    const target = await Message.findOne({ _id: replyTo, chatId });
    if (!target) throw httpError(404, "Message to reply to not found");
  }

  const message = await Message.create({
    chatId,
    senderId: req.userId,
    text: text.trim(),
    mediaUrl: media.url,
    mediaType: media.type,
    mediaPublicId: media.publicId,
    replyTo: replyTo || null,
    sharedPost: sharedPost || null,
    sharedReel: sharedReel || null,
    seenBy: [req.userId],
  });

  await Chat.updateOne({ _id: chatId }, { lastMessage: message._id, updatedAt: new Date() });
  const populated = clean(await populateMessage(Message.findById(message._id)));

  broadcast(chat, "receiveMessage", populated, req.userId);
  res.status(201).json(populated);
});

export const getMessages = asyncHandler(async (req, res) => {
  await loadChat(req.params.chatId, req.userId);
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const filter = { chatId: req.params.chatId, deletedFor: { $ne: req.userId } };
  if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };

  const messages = await populateMessage(Message.find(filter).sort({ createdAt: -1 }).limit(limit));
  const ordered = messages.reverse().map(clean);

  if (req.query.legacy === "true") return res.json(ordered);
  res.json({ messages: ordered, hasMore: messages.length === limit });
});

export const markChatSeen = asyncHandler(async (req, res) => {
  const chat = await loadChat(req.params.chatId, req.userId);
  const result = await Message.updateMany(
    { chatId: chat._id, senderId: { $ne: req.userId }, seenBy: { $ne: req.userId } },
    { $addToSet: { seenBy: req.userId }, $set: { seen: true } }
  );
  if (result.modifiedCount) broadcast(chat, "messagesSeen", { chatId: chat._id, userId: req.userId }, req.userId);
  res.json({ updated: result.modifiedCount });
});

export const reactToMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) throw httpError(404, "Message not found");
  const chat = await loadChat(message.chatId, req.userId);
  const emoji = String(req.body.emoji || "").trim();

  message.reactions = message.reactions.filter((r) => String(r.userId) !== String(req.userId));
  if (emoji) message.reactions.push({ userId: req.userId, emoji });
  await message.save();

  const payload = { chatId: message.chatId, messageId: message._id, reactions: message.reactions };
  broadcast(chat, "messageReaction", payload, req.userId);
  res.json(payload);
});

export const editMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) throw httpError(404, "Message not found");
  if (String(message.senderId) !== String(req.userId)) throw httpError(403, "Not authorized");
  if (message.isDeleted) throw httpError(400, "Message was deleted");
  const text = String(req.body.text || "").trim();
  if (!text) throw httpError(400, "Text is required");

  message.text = text;
  message.isEdited = true;
  await message.save();

  const chat = await Chat.findById(message.chatId);
  const payload = { chatId: message.chatId, messageId: message._id, text, isEdited: true };
  broadcast(chat, "messageEdited", payload, req.userId);
  res.json(payload);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) throw httpError(404, "Message not found");
  const chat = await loadChat(message.chatId, req.userId);

  if (req.query.scope === "everyone") {
    if (String(message.senderId) !== String(req.userId)) throw httpError(403, "Not authorized");
    if (message.mediaPublicId) await deleteAsset(message.mediaPublicId, message.mediaType);
    message.isDeleted = true;
    await message.save();
    const payload = { chatId: message.chatId, messageId: message._id };
    broadcast(chat, "messageDeleted", payload, req.userId);
    return res.json({ ...payload, scope: "everyone" });
  }

  await Message.updateOne({ _id: message._id }, { $addToSet: { deletedFor: req.userId } });
  res.json({ messageId: message._id, scope: "me" });
});

export const getUnreadTotal = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ members: req.userId }).select("_id mutedBy");
  const unread = await Message.countDocuments({
    chatId: { $in: chats.map((c) => c._id) },
    senderId: { $ne: req.userId },
    seenBy: { $ne: req.userId },
    deletedFor: { $ne: req.userId },
    isDeleted: false,
  });
  res.json({ unread });
});
