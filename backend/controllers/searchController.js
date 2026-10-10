import User from "../models/User.js";
import Post from "../models/Post.js";
import asyncHandler from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/text.js";
import { hiddenAuthorIds } from "../utils/access.js";

export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim().replace(/^[#@]/, "");
  if (!q) return res.json({ users: [], hashtags: [], posts: [] });
  const regex = new RegExp(escapeRegex(q), "i");
  const hidden = await hiddenAuthorIds(req.userId);

  const [users, hashtags, posts] = await Promise.all([
    User.find({ $or: [{ username: regex }, { name: regex }], _id: { $nin: hidden.blocked } })
      .select("username name profilePic isVerified")
      .sort({ isVerified: -1 })
      .limit(10),
    Post.aggregate([
      { $match: { hashtags: regex, isArchived: false, userId: { $nin: [...hidden.blocked, ...hidden.priv] } } },
      { $unwind: "$hashtags" },
      { $match: { hashtags: regex } },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]),
    Post.find({ caption: regex, isArchived: false, userId: { $nin: [...hidden.blocked, ...hidden.priv] } })
      .sort({ likesCount: -1 })
      .limit(10)
      .populate("userId", "username name profilePic isVerified"),
  ]);

  res.json({ users, hashtags, posts });
});
