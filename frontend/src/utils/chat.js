import { sameId, displayName, formatTime } from "./format";

export const otherMember = (chat, meId) =>
  chat?.members?.find((m) => !sameId(m, meId)) || chat?.members?.[0];

export const chatTitle = (chat, meId) =>
  chat?.isGroup ? chat.name || "Group" : displayName(otherMember(chat, meId));

export const chatAvatar = (chat, meId) =>
  chat?.isGroup ? chat.avatar : otherMember(chat, meId)?.profilePic;

export const memberOnline = (member, onlineSet) =>
  Boolean(member) && member.lastSeen !== null && (member.isOnline || onlineSet.has(String(member._id)));

export const previewText = (chat, meId) => {
  const msg = chat?.lastMessage;
  if (!msg) return "No messages yet";
  const prefix = sameId(msg.senderId, meId) ? "You: " : chat.isGroup && msg.senderId?.username ? `${msg.senderId.username}: ` : "";
  if (msg.isDeleted) return `${prefix}Message deleted`;
  if (msg.text) return `${prefix}${msg.text}`;
  if (msg.sharedPost) return `${prefix}Shared a post`;
  if (msg.sharedReel) return `${prefix}Shared a reel`;
  if (msg.mediaType === "video") return `${prefix}Video`;
  if (msg.mediaUrl) return `${prefix}Photo`;
  return `${prefix}Message`;
};

export const lastMessageTime = (chat) => (chat?.lastMessage ? formatTime(chat.lastMessage.createdAt) : "");
