import Post from "../models/Post.js";
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

const populatePost = (query) => query.populate("userId", USER_FIELDS).populate("mentions", "username");

const respondPage = (res, me, items, page, limit) =>
  res.json({
    posts: items.map((p) => shapeContent(p, me, "savedPosts")),
    page,
    hasMore: items.length === limit,
  });

export const createPost = asyncHandler(async (req, res) => {
  const { caption = "", location = "", commentsDisabled } = req.body;
  const files = req.files || (req.file ? [req.file] : []);
  if (!caption.trim() && !files.length) throw httpError(400, "Post needs a caption or media");

  const media = await Promise.all(files.map((f) => uploadFile(f, "social_media/posts")));
  const mentions = await resolveMentions(caption, req.userId);

  const post = await Post.create({
    userId: req.userId,
    caption,
    location,
    media,
    imageUrl: media.find((m) => m.type === "image")?.url,
    videoUrl: media.find((m) => m.type === "video")?.url,
    hashtags: extractHashtags(caption),
    mentions,
    commentsDisabled: String(commentsDisabled) === "true",
  });

  await notifyMentions({ users: mentions, sender: req.userId, post: post._id });
  const populated = await populatePost(Post.findById(post._id));
  res.status(201).json(shapeContent(populated, req.user, "savedPosts"));
});

export const getAllPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 10, 30);
  const me = await User.findById(req.userId).select("following muted blocked");
  const authors = [...me.following.filter((id) => !me.muted.some((m) => String(m) === String(id))), req.userId];
  const hidden = await hiddenAuthorIds(req.userId);
  const allowed = authors.filter((id) => !hidden.blocked.some((b) => String(b) === String(id)));

  const posts = await populatePost(
    Post.find({ userId: { $in: allowed }, isArchived: false }).sort({ createdAt: -1 }).skip(skip).limit(limit)
  );
  if (!posts.length && page === 1) {
    const fallback = await populatePost(
      Post.find({ isArchived: false, userId: { $nin: [...hidden.blocked, ...hidden.priv] } }).sort({ createdAt: -1 }).limit(limit)
    );
    return respondPage(res, req.user, fallback, page, limit);
  }
  respondPage(res, req.user, posts, page, limit);
});

export const getExplorePosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 12, 40);
  const hidden = await hiddenAuthorIds(req.userId);
  const me = await User.findById(req.userId).select("following");
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const posts = await populatePost(
    Post.find({
      isArchived: false,
      createdAt: { $gte: since },
      userId: { $nin: [...hidden.blocked, ...hidden.priv, req.userId, ...me.following] },
    })
      .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
  );
  respondPage(res, req.user, posts, page, limit);
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await populatePost(Post.findById(req.params.id));
  if (!post) throw httpError(404, "Post not found");
  await assertCanView(req.userId, post.userId._id);
  res.json(shapeContent(post, req.user, "savedPosts"));
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 12, 40);
  await assertCanView(req.userId, req.params.userId);
  const filter = { userId: req.params.userId, isArchived: false };
  const posts = await populatePost(Post.find(filter).sort({ isPinned: -1, createdAt: -1 }).skip(skip).limit(limit));
  respondPage(res, req.user, posts, page, limit);
});

export const getArchivedPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 12, 40);
  const posts = await populatePost(Post.find({ userId: req.userId, isArchived: true }).sort({ createdAt: -1 }).skip(skip).limit(limit));
  respondPage(res, req.user, posts, page, limit);
});

export const getPostsByHashtag = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req, 12, 40);
  const hidden = await hiddenAuthorIds(req.userId);
  const tag = req.params.tag.replace(/^#/, "").toLowerCase();
  const posts = await populatePost(
    Post.find({ hashtags: tag, isArchived: false, userId: { $nin: [...hidden.blocked, ...hidden.priv] } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  );
  respondPage(res, req.user, posts, page, limit);
});

export const getTrendingHashtags = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tags = await Post.aggregate([
    { $match: { createdAt: { $gte: since }, isArchived: false } },
    { $unwind: "$hashtags" },
    { $group: { _id: "$hashtags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);
  res.json(tags);
});

export const searchPosts = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ posts: [], page: 1, hasMore: false });
  const { page, limit, skip } = paginate(req, 12, 40);
  const hidden = await hiddenAuthorIds(req.userId);
  const posts = await populatePost(
    Post.find({ $text: { $search: q }, isArchived: false, userId: { $nin: [...hidden.blocked, ...hidden.priv] } })
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit)
  );
  respondPage(res, req.user, posts, page, limit);
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw httpError(404, "Post not found");
  if (String(post.userId) !== String(req.userId)) throw httpError(403, "Not authorized");

  const { caption, location, commentsDisabled, isArchived } = req.body;
  if (caption !== undefined) {
    post.caption = caption;
    post.hashtags = extractHashtags(caption);
    post.mentions = await resolveMentions(caption, req.userId);
  }
  if (location !== undefined) post.location = location;
  if (commentsDisabled !== undefined) post.commentsDisabled = String(commentsDisabled) === "true";
  if (isArchived !== undefined) post.isArchived = String(isArchived) === "true";
  await post.save();

  const populated = await populatePost(Post.findById(post._id));
  res.json(shapeContent(populated, req.user, "savedPosts"));
});

export const togglePin = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw httpError(404, "Post not found");
  if (String(post.userId) !== String(req.userId)) throw httpError(403, "Not authorized");
  if (!post.isPinned) {
    const pinned = await Post.countDocuments({ userId: req.userId, isPinned: true });
    if (pinned >= 3) throw httpError(400, "You can pin up to 3 posts");
  }
  post.isPinned = !post.isPinned;
  await post.save();
  res.json({ isPinned: post.isPinned });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw httpError(404, "Post not found");
  if (String(post.userId) !== String(req.userId)) throw httpError(403, "Not authorized");

  await Promise.all(post.media.map((m) => deleteAsset(m.publicId, m.type)));
  await Promise.all([
    Comment.deleteMany({ target: post._id, targetType: "Post" }),
    Notification.deleteMany({ post: post._id }),
    User.updateMany({ savedPosts: post._id }, { $pull: { savedPosts: post._id } }),
    post.deleteOne(),
  ]);
  res.json({ message: "Post deleted successfully", msg: "Post deleted successfully" });
});

export const likePost = likeHandler(Post, "post");
export const savePost = saveHandler(Post, "savedPosts");
export const sharePost = shareHandler(Post);
export const getPostLikers = likersHandler(Post);
export const getSavedPosts = savedListHandler(Post, "savedPosts", "posts");
