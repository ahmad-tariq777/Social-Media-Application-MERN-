import User from "../models/User.js";
import asyncHandler from "./asyncHandler.js";
import httpError from "./httpError.js";
import { assertCanView, USER_FIELDS } from "./access.js";
import { notify, removeNotification } from "./notify.js";
import { paginate } from "./pagination.js";

const findVisible = async (Model, req, select = "") => {
  const doc = await Model.findById(req.params.id).select(`userId likes ${select}`);
  if (!doc) throw httpError(404, "Not found");
  await assertCanView(req.userId, doc.userId);
  return doc;
};

export const likeHandler = (Model, kind) =>
  asyncHandler(async (req, res) => {
    const doc = await findVisible(Model, req);
    const liked = doc.likes.some((id) => String(id) === String(req.userId));
    const updated = await Model.findByIdAndUpdate(
      doc._id,
      liked
        ? { $pull: { likes: req.userId }, $inc: { likesCount: -1 } }
        : { $addToSet: { likes: req.userId }, $inc: { likesCount: 1 } },
      { new: true }
    ).select("likesCount");

    const ref = { [kind]: doc._id };
    if (liked) await removeNotification({ recipient: doc.userId, sender: req.userId, type: "like", ...ref });
    else await notify({ recipient: doc.userId, sender: req.userId, type: "like", ...ref });

    res.json({ liked: !liked, likesCount: Math.max(updated.likesCount, 0) });
  });

export const saveHandler = (Model, savedField) =>
  asyncHandler(async (req, res) => {
    const doc = await findVisible(Model, req);
    const me = await User.findById(req.userId).select(savedField);
    const saved = me[savedField].some((id) => String(id) === String(doc._id));
    await User.updateOne({ _id: req.userId }, saved ? { $pull: { [savedField]: doc._id } } : { $addToSet: { [savedField]: doc._id } });
    const updated = await Model.findByIdAndUpdate(doc._id, { $inc: { savesCount: saved ? -1 : 1 } }, { new: true }).select("savesCount");
    res.json({ saved: !saved, savesCount: Math.max(updated.savesCount, 0) });
  });

export const shareHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await findVisible(Model, req);
    const updated = await Model.findByIdAndUpdate(doc._id, { $inc: { sharesCount: 1 } }, { new: true }).select("sharesCount");
    res.json({ sharesCount: updated.sharesCount });
  });

export const likersHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const doc = await findVisible(Model, req);
    const { page, limit } = paginate(req, 20, 100);
    const ids = doc.likes.slice((page - 1) * limit, page * limit);
    const users = await User.find({ _id: { $in: ids } }).select(USER_FIELDS);
    res.json({ users, total: doc.likes.length, page, hasMore: page * limit < doc.likes.length });
  });

export const savedListHandler = (Model, savedField, key) =>
  asyncHandler(async (req, res) => {
    const { page, limit } = paginate(req, 12, 50);
    const me = await User.findById(req.userId).select(savedField);
    const ids = [...me[savedField]].reverse();
    const pageIds = ids.slice((page - 1) * limit, page * limit);
    const items = await Model.find({ _id: { $in: pageIds } }).populate("userId", USER_FIELDS);
    const order = new Map(pageIds.map((id, i) => [String(id), i]));
    items.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));
    res.json({ [key]: items, page, hasMore: page * limit < ids.length });
  });
