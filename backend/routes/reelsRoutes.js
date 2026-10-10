import express from "express";
import auth from "../middlewares/authMiddleware.js";
import validateId from "../middlewares/validateId.js";
import { videoUpload } from "../middlewares/upload.js";
import {
  createReel,
  getReels,
  getTrendingReels,
  getFollowingReels,
  getUserReels,
  getReelsByHashtag,
  getReel,
  updateReel,
  viewReel,
  deleteReel,
  toggleLike,
  saveReel,
  shareReel,
  getReelLikers,
  getSavedReels,
} from "../controllers/reelsController.js";
import {
  listComments,
  addComment,
  addReplyAlias,
  deleteComment,
  likeComment,
  setTarget,
} from "../controllers/commentController.js";

const router = express.Router();

router.use(auth);

router.post("/", videoUpload.single("video"), createReel);
router.get("/", getReels);
router.get("/trending", getTrendingReels);
router.get("/following", getFollowingReels);
router.get("/saved", getSavedReels);
router.get("/hashtag/:tag", getReelsByHashtag);
router.get("/user/:userId", validateId("userId"), getUserReels);

router.get("/:id", validateId("id"), getReel);
router.put("/:id", validateId("id"), updateReel);
router.delete("/:id", validateId("id"), deleteReel);
router.put("/:id/like", validateId("id"), toggleLike);
router.put("/:id/save", validateId("id"), saveReel);
router.post("/:id/view", validateId("id"), viewReel);
router.post("/:id/share", validateId("id"), shareReel);
router.get("/:id/likes", validateId("id"), getReelLikers);

router.get("/:id/comments", validateId("id"), setTarget("Reel"), listComments);
router.post("/:id/comments", validateId("id"), setTarget("Reel"), addComment);
router.post("/:id/comment", validateId("id"), setTarget("Reel"), addComment);
router.post("/:id/comment/:commentId/reply", validateId("id", "commentId"), setTarget("Reel"), addReplyAlias, addComment);
router.delete("/:id/comments/:commentId", validateId("id", "commentId"), deleteComment);
router.put("/:id/comments/:commentId/like", validateId("id", "commentId"), likeComment);

export default router;
