import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { emitToUser, isOnline } from "../utils/socketStore.js";
import { USER_FIELDS } from "../utils/access.js";

const populateChat = (query) =>
  query
    .populate("members", `${USER_FIELDS} lastSeen showOnlineStatus`)
    .populate({ path: "lastMessage", populate: { path: "senderId", select: "username" } });

const withPresence = async (chat, meId) => {
  const obj = chat.toObject();
  const unreadCount = await Message.countDocuments({
    chatId: chat._id,
    senderId: { $ne: meId },
    seenBy: { $ne: meId },
    deletedFor: { $ne: meId },
    isDeleted: false,
  });
  obj.members = obj.members.map((m) => ({
    ...m,
    isOnline: m.showOnlineStatus !== false && isOnline(m._id),
    lastSeen: m.showOnlineStatus === false ? null : m.lastSeen,
    showOnlineStatus: undefined,
  }));
  obj.unreadCount = unreadCount;
  obj.isMuted = chat.mutedBy.some((id) => String(id) === String(meId));
  return obj;
};

const assertMember = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw httpError(404, "Chat not found");
  if (!chat.members.some((m) => String(m) === String(userId))) throw httpError(403, "Not a member of this chat");
  return chat;
};

export const createChat = asyncHandler(async (req, res) => {
  const receiverId = req.body.receiverId || req.body.userId;
  if (!receiverId) throw httpError(400, "receiverId is required");
  if (String(receiverId) === String(req.userId)) throw httpError(400, "Cannot chat with yourself");

  const receiver = await User.findById(receiverId).select("blocked");
  if (!receiver) throw httpError(404, "User not found");
  if (receiver.blocked.some((b) => String(b) === String(req.userId)) || req.user.blocked.some((b) => String(b) === String(receiverId))) {
    throw httpError(403, "You cannot message this user");
  }

  let chat = await Chat.findOne({ isGroup: false, members: { $all: [req.userId, receiverId], $size: 2 } });
  if (!chat) chat = await Chat.create({ members: [req.userId, receiverId] });

  const populated = await populateChat(Chat.findById(chat._id));
  res.status(200).json(await withPresence(populated, req.userId));
});

export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, members = [] } = req.body;
  const unique = [...new Set(members.map(String))].filter((id) => id !== String(req.userId));
  if (!name?.trim()) throw httpError(400, "Group name is required");
  if (unique.length < 2) throw httpError(400, "A group needs at least 3 members");
  if (unique.length > 99) throw httpError(400, "Group is too large");

  const users = await User.find({ _id: { $in: unique }, blocked: { $ne: req.userId } }).select("_id");
  const chat = await Chat.create({
    isGroup: true,
    name: name.trim(),
    members: [req.userId, ...users.map((u) => u._id)],
    admins: [req.userId],
  });
  const populated = await populateChat(Chat.findById(chat._id));
  const shaped = await withPresence(populated, req.userId);
  chat.members.forEach((m) => emitToUser(m, "chatCreated", shaped));
  res.status(201).json(shaped);
});

export const getUserChats = asyncHandler(async (req, res) => {
  const chats = await populateChat(Chat.find({ members: req.userId }).sort({ updatedAt: -1 }));
  res.json(await Promise.all(chats.map((c) => withPresence(c, req.userId))));
});

export const findChat = asyncHandler(async (req, res) => {
  const { firstId, secondId } = req.params;
  const chat = await populateChat(Chat.findOne({ isGroup: false, members: { $all: [firstId, secondId], $size: 2 } }));
  if (!chat || !chat.members.some((m) => String(m._id) === String(req.userId))) return res.json(null);
  res.json(await withPresence(chat, req.userId));
});

export const getChat = asyncHandler(async (req, res) => {
  await assertMember(req.params.chatId, req.userId);
  const chat = await populateChat(Chat.findById(req.params.chatId));
  res.json(await withPresence(chat, req.userId));
});

export const updateGroup = asyncHandler(async (req, res) => {
  const chat = await assertMember(req.params.chatId, req.userId);
  if (!chat.isGroup) throw httpError(400, "Not a group chat");
  if (!chat.admins.some((a) => String(a) === String(req.userId))) throw httpError(403, "Admins only");

  if (req.body.name?.trim()) chat.name = req.body.name.trim();
  if (req.body.avatar !== undefined) chat.avatar = req.body.avatar;
  if (Array.isArray(req.body.addMembers)) {
    const users = await User.find({ _id: { $in: req.body.addMembers }, blocked: { $ne: req.userId } }).select("_id");
    users.forEach((u) => {
      if (!chat.members.some((m) => String(m) === String(u._id))) chat.members.push(u._id);
    });
  }
  if (Array.isArray(req.body.removeMembers)) {
    const remove = req.body.removeMembers.map(String).filter((id) => id !== String(req.userId));
    chat.members = chat.members.filter((m) => !remove.includes(String(m)));
    chat.admins = chat.admins.filter((m) => !remove.includes(String(m)));
  }
  if (Array.isArray(req.body.addAdmins)) {
    req.body.addAdmins.forEach((id) => {
      if (chat.members.some((m) => String(m) === String(id)) && !chat.admins.some((a) => String(a) === String(id))) chat.admins.push(id);
    });
  }
  await chat.save();

  const populated = await populateChat(Chat.findById(chat._id));
  const shaped = await withPresence(populated, req.userId);
  chat.members.forEach((m) => emitToUser(m, "chatUpdated", shaped));
  res.json(shaped);
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const chat = await assertMember(req.params.chatId, req.userId);
  if (!chat.isGroup) throw httpError(400, "Not a group chat");
  chat.members = chat.members.filter((m) => String(m) !== String(req.userId));
  chat.admins = chat.admins.filter((m) => String(m) !== String(req.userId));
  if (chat.members.length === 0) {
    await Message.deleteMany({ chatId: chat._id });
    await chat.deleteOne();
    return res.json({ msg: "Group deleted" });
  }
  if (chat.admins.length === 0) chat.admins.push(chat.members[0]);
  await chat.save();
  chat.members.forEach((m) => emitToUser(m, "chatUpdated", { _id: chat._id, left: req.userId }));
  res.json({ msg: "Left group" });
});

export const toggleMuteChat = asyncHandler(async (req, res) => {
  const chat = await assertMember(req.params.chatId, req.userId);
  const muted = chat.mutedBy.some((id) => String(id) === String(req.userId));
  await Chat.updateOne({ _id: chat._id }, muted ? { $pull: { mutedBy: req.userId } } : { $addToSet: { mutedBy: req.userId } });
  res.json({ muted: !muted });
});

export const clearChatForMe = asyncHandler(async (req, res) => {
  const chat = await assertMember(req.params.chatId, req.userId);
  await Message.updateMany({ chatId: chat._id }, { $addToSet: { deletedFor: req.userId } });
  res.json({ msg: "Chat cleared" });
});
