import Story from "../models/Story.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { uploadFile, deleteAsset } from "../utils/cloud.js";
import { assertCanView, USER_FIELDS } from "../utils/access.js";
import { notify } from "../utils/notify.js";

const DAY = 24 * 60 * 60 * 1000;

const shape = (story, meId) => {
  const obj = story.toObject();
  return {
    ...obj,
    viewedByMe: obj.viewers.some((v) => String(v._id || v) === String(meId)),
    likedByMe: obj.likes.some((v) => String(v) === String(meId)),
    viewersCount: obj.viewers.length,
    viewers: String(obj.userId._id || obj.userId) === String(meId) ? obj.viewers : undefined,
  };
};

export const createStory = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, "Media file is required");
  const uploaded = await uploadFile(req.file, "social_media/stories");
  const story = await Story.create({
    userId: req.userId,
    mediaUrl: uploaded.url,
    mediaType: uploaded.type,
    publicId: uploaded.publicId,
    caption: req.body.caption || "",
    expiresAt: new Date(Date.now() + DAY),
  });
  const populated = await story.populate("userId", USER_FIELDS);
  res.status(201).json(shape(populated, req.userId));
});

export const getStoriesFeed = asyncHandler(async (req, res) => {
  const me = await User.findById(req.userId).select("following muted blocked");
  const authors = [req.userId, ...me.following.filter((id) => !me.muted.some((m) => String(m) === String(id)))];
  const blockedMe = await User.find({ blocked: req.userId }).select("_id");
  const excluded = new Set([...me.blocked, ...blockedMe.map((u) => u._id)].map(String));
  const allowed = authors.filter((id) => !excluded.has(String(id)));

  const stories = await Story.find({ userId: { $in: allowed }, expiresAt: { $gt: new Date() } })
    .sort({ createdAt: 1 })
    .populate("userId", USER_FIELDS);

  const groups = new Map();
  for (const story of stories) {
    const key = String(story.userId._id);
    if (!groups.has(key)) groups.set(key, { user: story.userId, stories: [] });
    groups.get(key).stories.push(shape(story, req.userId));
  }

  const result = [...groups.values()].map((g) => ({ ...g, hasUnseen: g.stories.some((s) => !s.viewedByMe) }));
  result.sort((a, b) => {
    if (String(a.user._id) === String(req.userId)) return -1;
    if (String(b.user._id) === String(req.userId)) return 1;
    return Number(b.hasUnseen) - Number(a.hasUnseen);
  });
  res.json(result);
});

export const getUserStories = asyncHandler(async (req, res) => {
  await assertCanView(req.userId, req.params.userId);
  const stories = await Story.find({ userId: req.params.userId, expiresAt: { $gt: new Date() } })
    .sort({ createdAt: 1 })
    .populate("userId", USER_FIELDS);
  res.json(stories.map((s) => shape(s, req.userId)));
});

export const viewStory = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ _id: req.params.id, expiresAt: { $gt: new Date() } });
  if (!story) throw httpError(404, "Story not found");
  await assertCanView(req.userId, story.userId);
  if (String(story.userId) !== String(req.userId)) {
    await Story.updateOne({ _id: story._id }, { $addToSet: { viewers: req.userId } });
  }
  res.json({ viewed: true });
});

export const getStoryViewers = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id).populate("viewers", USER_FIELDS);
  if (!story) throw httpError(404, "Story not found");
  if (String(story.userId) !== String(req.userId)) throw httpError(403, "Not authorized");
  res.json({ viewers: story.viewers, likes: story.likes });
});

export const likeStory = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ _id: req.params.id, expiresAt: { $gt: new Date() } });
  if (!story) throw httpError(404, "Story not found");
  await assertCanView(req.userId, story.userId);
  const liked = story.likes.some((id) => String(id) === String(req.userId));
  await Story.updateOne({ _id: story._id }, liked ? { $pull: { likes: req.userId } } : { $addToSet: { likes: req.userId } });
  if (!liked) await notify({ recipient: story.userId, sender: req.userId, type: "like", text: "story" });
  res.json({ liked: !liked });
});

export const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw httpError(404, "Story not found");
  if (String(story.userId) !== String(req.userId)) throw httpError(403, "Not authorized");
  await deleteAsset(story.publicId, story.mediaType);
  await story.deleteOne();
  res.json({ msg: "Story deleted" });
});
