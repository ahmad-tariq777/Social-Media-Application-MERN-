import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import { paginate } from "../utils/pagination.js";
import { shapeComment } from "../utils/shape.js";
import { assertCanView, USER_FIELDS } from "../utils/access.js";
import { notify, removeNotification } from "../utils/notify.js";
import { resolveMentions, notifyMentions } from "../utils/mentions.js";

const models = { Post, Reel };
const refKey = { Post: "post", Reel: "reel" };

const loadTarget = async (type, id, viewerId) => {
  const target = await models[type].findById(id).select("userId commentsDisabled");
  if (!target) throw httpError(404, `${type} not found`);
  await assertCanView(viewerId, target.userId);
  return target;
};

const populateComment = (query) => query.populate("userId", USER_FIELDS).populate("mentions", "username");

export const listComments = asyncHandler(async (req, res) => {
  const type = req.targetType;
  const target = await loadTarget(type, req.params.id, req.userId);
  const { page, limit, skip } = paginate(req, 15, 50);
  const sort = req.query.sort === "new" ? { isPinned: -1, createdAt: -1 } : { isPinned: -1, likesCount: -1, createdAt: -1 };

  const comments = await populateComment(
    Comment.find({ target: target._id, targetType: type, parent: null }).sort(sort).skip(skip).limit(limit)
  );
  res.json({
    comments: comments.map((c) => shapeComment(c, req.user)),
    page,
    hasMore: comments.length === limit,
  });
});

export const addComment = asyncHandler(async (req, res) => {
  const type = req.targetType;
  const target = await loadTarget(type, req.params.id, req.userId);
  if (target.commentsDisabled) throw httpError(403, "Comments are turned off");

  const text = String(req.body.text || "").trim();
  if (!text) throw httpError(400, "Comment text is required");

  let parent = null;
  let parentId = req.body.parentId || null;
  if (parentId) {
    parent = await Comment.findOne({ _id: parentId, target: target._id, targetType: type });
    if (!parent) throw httpError(404, "Parent comment not found");
    if (parent.parent) {
      parentId = parent.parent;
    }
  }

  const mentions = await resolveMentions(text, req.userId);
  const comment = await Comment.create({
    userId: req.userId,
    targetType: type,
    target: target._id,
    parent: parentId,
    text,
    mentions,
  });

  await models[type].updateOne({ _id: target._id }, { $inc: { commentsCount: 1 } });
  if (parentId) await Comment.updateOne({ _id: parentId }, { $inc: { repliesCount: 1 } });

  const ref = { [refKey[type]]: target._id, comment: comment._id };
  if (parent) {
    await notify({ recipient: parent.userId, sender: req.userId, type: "reply", text: text.slice(0, 80), ...ref });
    if (String(target.userId) !== String(parent.userId)) {
      await notify({ recipient: target.userId, sender: req.userId, type: "comment", text: text.slice(0, 80), ...ref });
    }
  } else {
    await notify({ recipient: target.userId, sender: req.userId, type: "comment", text: text.slice(0, 80), ...ref });
  }
  await notifyMentions({ users: mentions, sender: req.userId, [refKey[type]]: target._id, comment: comment._id });

  const populated = await populateComment(Comment.findById(comment._id));
  res.status(201).json(shapeComment(populated, req.user));
});

export const addReplyAlias = (req, res, next) => {
  req.body.parentId = req.params.commentId;
  next();
};

export const listReplies = asyncHandler(async (req, res) => {
  const parent = await Comment.findById(req.params.commentId);
  if (!parent) throw httpError(404, "Comment not found");
  await loadTarget(parent.targetType, parent.target, req.userId);
  const { page, limit, skip } = paginate(req, 10, 50);
  const replies = await populateComment(Comment.find({ parent: parent._id }).sort({ createdAt: 1 }).skip(skip).limit(limit));
  res.json({
    replies: replies.map((c) => shapeComment(c, req.user)),
    page,
    hasMore: replies.length === limit,
  });
});

export const likeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw httpError(404, "Comment not found");
  await loadTarget(comment.targetType, comment.target, req.userId);

  const liked = comment.likes.some((id) => String(id) === String(req.userId));
  const updated = await Comment.findByIdAndUpdate(
    comment._id,
    liked
      ? { $pull: { likes: req.userId }, $inc: { likesCount: -1 } }
      : { $addToSet: { likes: req.userId }, $inc: { likesCount: 1 } },
    { new: true }
  ).select("likesCount");

  if (liked) await removeNotification({ recipient: comment.userId, sender: req.userId, type: "commentLike", comment: comment._id });
  else await notify({ recipient: comment.userId, sender: req.userId, type: "commentLike", comment: comment._id, [refKey[comment.targetType]]: comment.target });

  res.json({ liked: !liked, likesCount: Math.max(updated.likesCount, 0) });
});

export const editComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw httpError(404, "Comment not found");
  if (String(comment.userId) !== String(req.userId)) throw httpError(403, "Not authorized");
  const text = String(req.body.text || "").trim();
  if (!text) throw httpError(400, "Comment text is required");
  comment.text = text;
  comment.isEdited = true;
  comment.mentions = await resolveMentions(text, req.userId);
  await comment.save();
  const populated = await populateComment(Comment.findById(comment._id));
  res.json(shapeComment(populated, req.user));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw httpError(404, "Comment not found");

  const target = await models[comment.targetType].findById(comment.target).select("userId");
  const isAuthor = String(comment.userId) === String(req.userId);
  const isOwner = target && String(target.userId) === String(req.userId);
  if (!isAuthor && !isOwner) throw httpError(403, "Not authorized");

  const replies = await Comment.find({ parent: comment._id }).select("_id");
  const removed = 1 + replies.length;
  const ids = [comment._id, ...replies.map((r) => r._id)];

  await Comment.deleteMany({ _id: { $in: ids } });
  await Notification.deleteMany({ comment: { $in: ids } });
  if (target) await models[comment.targetType].updateOne({ _id: target._id }, { $inc: { commentsCount: -removed } });
  if (comment.parent) await Comment.updateOne({ _id: comment.parent }, { $inc: { repliesCount: -1 } });

  res.json({ message: "Comment deleted successfully", msg: "Comment deleted successfully", removed });
});

export const pinComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw httpError(404, "Comment not found");
  if (comment.parent) throw httpError(400, "Only top-level comments can be pinned");
  const target = await models[comment.targetType].findById(comment.target).select("userId");
  if (!target || String(target.userId) !== String(req.userId)) throw httpError(403, "Not authorized");

  if (!comment.isPinned) {
    await Comment.updateMany({ target: comment.target, targetType: comment.targetType, isPinned: true }, { isPinned: false });
  }
  comment.isPinned = !comment.isPinned;
  await comment.save();
  res.json({ isPinned: comment.isPinned });
});

export const setTarget = (type) => (req, res, next) => {
  req.targetType = type;
  next();
};
