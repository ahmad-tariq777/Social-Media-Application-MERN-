import Reel from "../models/Reel.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { paginate } from "../utils/pagination.js";
import { extractHashtags } from "../utils/text.js";
import { uploadFile, deleteAsset } from "../utils/cloud.js";
import { shapeContent } from "../utils/shape.js";
import { assertCanView, hiddenAuthorIds, USER_FIELDS } from "../utils/access.js";
import { resolveMentions, notifyMentions } from "../utils/mentions.js";
import { likeHandler, saveHandler, shareHandler, likersHandler, savedListHandler } from "../utils/engagement.js";

const populateReel = (query) => query.populate("userId", USER_FIELDS);

const respondPage = (res, me, items, page, limit) =>
  res.json({
    reels: items.map((r) => shapeContent(r, me, "savedReels")),
    page,
    hasMore: items.length === limit,
  });

export const createReel = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, "Video file is required");
  const caption = req.body.caption || "";
  const uploaded = await uploadFile(req.file, "social_media/reels");
  const mentions = await resolveMentions(caption, req.userId);

  const reel = await Reel.create({
    userId: req.userId,
    videoUrl: uploaded.url,
    videoPublicId: uploaded.publicId,
    duration: uploaded.duration,
    caption,
    hashtags: extractHashtags(caption),
    mentions,
    commentsDisabled: String(req.body.commentsDisabled) === "true",
  });

  await notifyMentions({ users: mentions, sender: req.userId, reel: reel._id });
  const populated = await populateReel(Reel.findById(reel._id));
  res.status(201).json(shapeContent(populated, req.user, "savedReels"));
});

export const getReels = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 8, 20);
  const hidden = await hiddenAuthorIds(req.userId);
  const me = await User.findById(req.userId).select("muted");
  const reels = await populateReel(
    Reel.find({ userId: { $nin: [...hidden.blocked, ...hidden.priv, ...me.muted] } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  );
  if (req.query.legacy === "true") return res.json(reels.map((r) => shapeContent(r, req.user, "savedReels")));
  respondPage(res, req.user, reels, page, limit);
});

export const getTrendingReels = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 8, 20);
  const hidden = await hiddenAuthorIds(req.userId);
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const reels = await populateReel(
    Reel.find({ createdAt: { $gte: since }, userId: { $nin: [...hidden.blocked, ...hidden.priv] } })
      .sort({ viewsCount: -1, likesCount: -1 })
      .skip(skip)
      .limit(limit)
  );
  respondPage(res, req.user, reels, page, limit);
});

export const getFollowingReels = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 8, 20);
  const me = await User.findById(req.userId).select("following");
  const reels = await populateReel(Reel.find({ userId: { $in: me.following } }).sort({ createdAt: -1 }).skip(skip).limit(limit));
  respondPage(res, req.user, reels, page, limit);
});

export const getUserReels = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 12, 30);
  await assertCanView(req.userId, req.params.userId);
  const reels = await populateReel(Reel.find({ userId: req.params.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit));
  respondPage(res, req.user, reels, page, limit);
});

export const getReelsByHashtag = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 8, 20);
  const hidden = await hiddenAuthorIds(req.userId);
  const tag = req.params.tag.replace(/^#/, "").toLowerCase();
  const reels = await populateReel(
    Reel.find({ hashtags: tag, userId: { $nin: [...hidden.blocked, ...hidden.priv] } }).sort({ createdAt: -1 }).skip(skip).limit(limit)
  );
  respondPage(res, req.user, reels, page, limit);
});

export const getReel = asyncHandler(async (req, res) => {
  const reel = await populateReel(Reel.findById(req.params.id));
  if (!reel) throw httpError(404, "Reel not found");
  await assertCanView(req.userId, reel.userId._id);
  res.json(shapeContent(reel, req.user, "savedReels"));
});

export const updateReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findById(req.params.id);
  if (!reel) throw httpError(404, "Reel not found");
  if (String(reel.userId) !== String(req.userId)) throw httpError(403, "Not authorized");
  if (req.body.caption !== undefined) {
    reel.caption = req.body.caption;
    reel.hashtags = extractHashtags(req.body.caption);
    reel.mentions = await resolveMentions(req.body.caption, req.userId);
  }
  if (req.body.commentsDisabled !== undefined) reel.commentsDisabled = String(req.body.commentsDisabled) === "true";
  await reel.save();
  const populated = await populateReel(Reel.findById(reel._id));
  res.json(shapeContent(populated, req.user, "savedReels"));
});

export const viewReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findById(req.params.id).select("userId");
  if (!reel) throw httpError(404, "Reel not found");
  await assertCanView(req.userId, reel.userId);
  const updated = await Reel.findByIdAndUpdate(reel._id, { $inc: { viewsCount: 1 } }, { new: true }).select("viewsCount");
  res.json({ viewsCount: updated.viewsCount });
});

export const deleteReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findById(req.params.id);
  if (!reel) throw httpError(404, "Reel not found");
  if (String(reel.userId) !== String(req.userId)) throw httpError(403, "Not authorized");

  await deleteAsset(reel.videoPublicId, "video");
  await Promise.all([
    Comment.deleteMany({ target: reel._id, targetType: "Reel" }),
    Notification.deleteMany({ reel: reel._id }),
    User.updateMany({ savedReels: reel._id }, { $pull: { savedReels: reel._id } }),
    reel.deleteOne(),
  ]);
  res.json({ message: "Reel deleted successfully", msg: "Reel deleted successfully" });
});

export const toggleLike = likeHandler(Reel, "reel");
export const saveReel = saveHandler(Reel, "savedReels");
export const shareReel = shareHandler(Reel);
export const getReelLikers = likersHandler(Reel);
export const getSavedReels = savedListHandler(Reel, "savedReels", "reels");
