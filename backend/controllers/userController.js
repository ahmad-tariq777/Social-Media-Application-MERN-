import User from "../models/User.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { paginate } from "../utils/pagination.js";
import { escapeRegex } from "../utils/text.js";
import { notify, removeNotification } from "../utils/notify.js";
import { uploadFile } from "../utils/cloud.js";
import { USER_FIELDS } from "../utils/access.js";

const same = (a, b) => String(a) === String(b);
const includesId = (list, id) => list.some((x) => same(x, id));

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -savedPosts -savedReels -muted -sentRequests");
  if (!user) throw httpError(404, "User not found");

  const me = req.user;
  const isSelf = same(me._id, user._id);
  const blockedByThem = includesId(user.blocked, me._id);
  const isBlocked = includesId(me.blocked, user._id);
  const isFollowing = includesId(user.followers, me._id);
  const isRequested = includesId(user.followRequests, me._id);
  const canView = isSelf || (!blockedByThem && !isBlocked && (!user.isPrivate || isFollowing));

  const [postsCount, reelsCount] = canView
    ? await Promise.all([
        Post.countDocuments({ userId: user._id, isArchived: false }),
        Reel.countDocuments({ userId: user._id }),
      ])
    : [0, 0];

  const base = user.toObject();
  delete base.blocked;
  if (!isSelf) delete base.followRequests;
  if (!canView) {
    base.followers = [];
    base.following = [];
  }

  res.json({
    ...base,
    followersCount: user.followers.length,
    followingCount: user.following.length,
    postsCount,
    reelsCount,
    isSelf,
    isFollowing,
    isRequested,
    isBlocked,
    blockedByThem,
    canView,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  if (!same(req.user._id, req.params.id)) throw httpError(403, "Not authorized");

  const allowed = ["name", "bio", "website", "location", "isPrivate", "showOnlineStatus", "username", "profilePic", "coverPic"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.username) {
    updates.username = String(updates.username).trim();
    const taken = await User.findOne({ username: updates.username, _id: { $ne: req.user._id } });
    if (taken) throw httpError(409, "Username already taken");
  }

  const current = await User.findById(req.user._id);

  if (req.files?.profilePic?.[0]) {
    const uploaded = await uploadFile(req.files.profilePic[0], "social_media/avatars");
    updates.profilePic = uploaded.url;
  }
  if (req.files?.coverPic?.[0]) {
    const uploaded = await uploadFile(req.files.coverPic[0], "social_media/covers");
    updates.coverPic = uploaded.url;
  }

  const goingPublic = current.isPrivate && updates.isPrivate !== undefined && String(updates.isPrivate) === "false";
  if (goingPublic && current.followRequests.length) {
    const requesters = current.followRequests;
    await User.updateMany({ _id: { $in: requesters } }, { $addToSet: { following: current._id }, $pull: { sentRequests: current._id } });
    await User.updateOne({ _id: current._id }, { $addToSet: { followers: { $each: requesters } }, $set: { followRequests: [] } });
  }

  const updated = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }).select("-password");
  res.json(updated);
});

export const followUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (same(req.user._id, targetId)) throw httpError(400, "Cannot follow yourself");

  const target = await User.findById(targetId);
  if (!target) throw httpError(404, "User not found");
  if (includesId(target.blocked, req.user._id) || includesId(req.user.blocked, targetId)) throw httpError(403, "Action not allowed");
  if (includesId(target.followers, req.user._id)) throw httpError(400, "Already following");
  if (includesId(target.followRequests, req.user._id)) throw httpError(400, "Request already sent");

  if (target.isPrivate) {
    await User.updateOne({ _id: targetId }, { $addToSet: { followRequests: req.user._id } });
    await User.updateOne({ _id: req.user._id }, { $addToSet: { sentRequests: targetId } });
    await notify({ recipient: targetId, sender: req.user._id, type: "followRequest" });
    return res.json({ msg: "Follow request sent", requested: true });
  }

  await User.updateOne({ _id: targetId }, { $addToSet: { followers: req.user._id } });
  await User.updateOne({ _id: req.user._id }, { $addToSet: { following: targetId } });
  await notify({ recipient: targetId, sender: req.user._id, type: "follow" });
  res.json({ msg: "User followed", following: true });
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const target = await User.findById(targetId);
  if (!target) throw httpError(404, "User not found");

  if (includesId(target.followRequests, req.user._id)) {
    await User.updateOne({ _id: targetId }, { $pull: { followRequests: req.user._id } });
    await User.updateOne({ _id: req.user._id }, { $pull: { sentRequests: targetId } });
    await removeNotification({ recipient: targetId, sender: req.user._id, type: "followRequest" });
    return res.json({ msg: "Follow request cancelled" });
  }

  if (!includesId(target.followers, req.user._id)) throw httpError(400, "Not following this user");

  await User.updateOne({ _id: targetId }, { $pull: { followers: req.user._id } });
  await User.updateOne({ _id: req.user._id }, { $pull: { following: targetId } });
  await removeNotification({ recipient: targetId, sender: req.user._id, type: "follow" });
  res.json({ msg: "User unfollowed" });
});

export const getFollowRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("followRequests", USER_FIELDS);
  res.json(user.followRequests);
});

export const acceptFollowRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;
  const me = await User.findById(req.user._id);
  if (!includesId(me.followRequests, requesterId)) throw httpError(404, "No such request");

  await User.updateOne({ _id: me._id }, { $pull: { followRequests: requesterId }, $addToSet: { followers: requesterId } });
  await User.updateOne({ _id: requesterId }, { $pull: { sentRequests: me._id }, $addToSet: { following: me._id } });
  await removeNotification({ recipient: me._id, sender: requesterId, type: "followRequest" });
  await notify({ recipient: requesterId, sender: me._id, type: "followAccept" });
  res.json({ msg: "Request accepted" });
});

export const rejectFollowRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;
  await User.updateOne({ _id: req.user._id }, { $pull: { followRequests: requesterId } });
  await User.updateOne({ _id: requesterId }, { $pull: { sentRequests: req.user._id } });
  await removeNotification({ recipient: req.user._id, sender: requesterId, type: "followRequest" });
  res.json({ msg: "Request rejected" });
});

export const removeFollower = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { followers: req.params.id } });
  await User.updateOne({ _id: req.params.id }, { $pull: { following: req.user._id } });
  res.json({ msg: "Follower removed" });
});

const listConnections = (field) =>
  asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id).select(`${field} isPrivate followers blocked`);
    if (!target) throw httpError(404, "User not found");
    const isSelf = same(req.user._id, target._id);
    if (!isSelf) {
      if (includesId(target.blocked, req.user._id)) throw httpError(403, "Content unavailable");
      if (target.isPrivate && !includesId(target.followers, req.user._id)) throw httpError(403, "This account is private");
    }
    const { page, limit } = paginate(req, 20, 100);
    const ids = target[field].slice((page - 1) * limit, page * limit);
    const users = await User.find({ _id: { $in: ids } }).select(USER_FIELDS + " bio");
    res.json({ users, total: target[field].length, page, hasMore: page * limit < target[field].length });
  });

export const getFollowers = listConnections("followers");
export const getFollowing = listConnections("following");

export const blockUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (same(req.user._id, targetId)) throw httpError(400, "Cannot block yourself");
  const target = await User.findById(targetId);
  if (!target) throw httpError(404, "User not found");

  await User.updateOne(
    { _id: req.user._id },
    { $addToSet: { blocked: targetId }, $pull: { followers: targetId, following: targetId, followRequests: targetId, sentRequests: targetId } }
  );
  await User.updateOne(
    { _id: targetId },
    { $pull: { followers: req.user._id, following: req.user._id, followRequests: req.user._id, sentRequests: req.user._id } }
  );
  res.json({ msg: "User blocked" });
});

export const unblockUser = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { blocked: req.params.id } });
  res.json({ msg: "User unblocked" });
});

export const getBlockedUsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("blocked", USER_FIELDS);
  res.json(user.blocked);
});

export const toggleMute = asyncHandler(async (req, res) => {
  const muted = includesId(req.user.muted || [], req.params.id);
  await User.updateOne({ _id: req.user._id }, muted ? { $pull: { muted: req.params.id } } : { $addToSet: { muted: req.params.id } });
  res.json({ muted: !muted });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || req.query.username || "").trim();
  if (!q) return res.json([]);
  const { limit, skip } = paginate(req, 20, 50);
  const regex = new RegExp(escapeRegex(q), "i");

  const filter = { $or: [{ username: regex }, { name: regex }] };
  if (req.user) {
    const blockedMe = await User.find({ blocked: req.user._id }).select("_id");
    filter._id = { $nin: [...req.user.blocked, ...blockedMe.map((u) => u._id)] };
  }

  const users = await User.find(filter)
    .select("_id username name profilePic isVerified followers")
    .sort({ isVerified: -1, username: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json(users.map(({ followers, ...u }) => ({ ...u, followersCount: followers.length })));
});

export const getSuggestions = asyncHandler(async (req, res) => {
  const me = await User.findById(req.user._id).select("following blocked sentRequests");
  const exclude = [me._id, ...me.following, ...me.blocked, ...me.sentRequests];
  const blockedMe = await User.find({ blocked: me._id }).select("_id");
  exclude.push(...blockedMe.map((u) => u._id));

  const mutual = await User.aggregate([
    { $match: { _id: { $in: me.following } } },
    { $unwind: "$following" },
    { $match: { following: { $nin: exclude } } },
    { $group: { _id: "$following", mutualCount: { $sum: 1 } } },
    { $sort: { mutualCount: -1 } },
    { $limit: 20 },
  ]);

  const mutualIds = mutual.map((m) => m._id);
  const mutualUsers = await User.find({ _id: { $in: mutualIds } }).select("_id username name bio profilePic isVerified");
  const countMap = Object.fromEntries(mutual.map((m) => [String(m._id), m.mutualCount]));

  let results = mutualUsers
    .map((u) => ({ ...u.toObject(), mutualCount: countMap[String(u._id)] }))
    .sort((a, b) => b.mutualCount - a.mutualCount);

  if (results.length < 20) {
    const filler = await User.aggregate([
      { $match: { _id: { $nin: [...exclude, ...mutualIds] } } },
      { $addFields: { followersCount: { $size: "$followers" } } },
      { $sort: { followersCount: -1 } },
      { $limit: 20 - results.length },
      { $project: { username: 1, name: 1, bio: 1, profilePic: 1, isVerified: 1 } },
    ]);
    results = [...results, ...filler.map((u) => ({ ...u, mutualCount: 0 }))];
  }

  res.json(results);
});

export const deleteProfileImage = asyncHandler(async (req, res) => {
  const field = req.params.type === "cover" ? "coverPic" : "profilePic";
  await User.updateOne({ _id: req.user._id }, { $set: { [field]: "" } });
  res.json({ msg: "Image removed" });
});

