import User from "../models/User.js";
import httpError from "./httpError.js";

export const USER_FIELDS = "username name profilePic isVerified";

const has = (list, id) => list.some((x) => String(x) === String(id));

export const getRelation = async (viewerId, ownerId) => {
  if (String(viewerId) === String(ownerId)) return { self: true, allowed: true, blocked: false, following: true };
  const [viewer, owner] = await Promise.all([
    User.findById(viewerId).select("blocked following"),
    User.findById(ownerId).select("blocked followers isPrivate"),
  ]);
  if (!owner) throw httpError(404, "User not found");
  const blocked = has(owner.blocked, viewerId) || has(viewer.blocked, ownerId);
  const following = has(owner.followers, viewerId);
  return {
    self: false,
    blocked,
    following,
    allowed: !blocked && (!owner.isPrivate || following),
  };
};

export const assertCanView = async (viewerId, ownerId) => {
  const rel = await getRelation(viewerId, ownerId);
  if (rel.blocked) throw httpError(403, "Content unavailable");
  if (!rel.allowed) throw httpError(403, "This account is private");
  return rel;
};

export const hiddenAuthorIds = async (viewerId) => {
  const me = await User.findById(viewerId).select("blocked");
  const blockedMe = await User.find({ blocked: viewerId }).select("_id");
  const privateUsers = await User.find({
    isPrivate: true,
    followers: { $ne: viewerId },
    _id: { $ne: viewerId },
  }).select("_id");
  return {
    blocked: [...me.blocked, ...blockedMe.map((u) => u._id)],
    priv: privateUsers.map((u) => u._id),
  };
};
