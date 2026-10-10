import Report from "../models/Report.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import Comment from "../models/Comment.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";

const models = { User, Post, Reel, Comment };

export const createReport = asyncHandler(async (req, res) => {
  const { targetType, target, reason, details = "" } = req.body;
  if (!models[targetType]) throw httpError(400, "Invalid target type");
  const exists = await models[targetType].exists({ _id: target });
  if (!exists) throw httpError(404, "Target not found");
  if (targetType === "User" && String(target) === String(req.userId)) throw httpError(400, "Cannot report yourself");

  try {
    await Report.create({ reporter: req.userId, targetType, target, reason, details });
  } catch (err) {
    if (err.code === 11000) throw httpError(409, "You already reported this");
    throw err;
  }
  res.status(201).json({ msg: "Report submitted" });
});

export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.userId }).sort({ createdAt: -1 }).limit(50);
  res.json(reports);
});
