import express from "express";
import auth from "../middlewares/authMiddleware.js";
import validateId from "../middlewares/validateId.js";
import { mediaUpload } from "../middlewares/upload.js";
import {
  createPost,
  getAllPosts,
  getExplorePosts,
  getPost,
  getUserPosts,
  getArchivedPosts,
  getPostsByHashtag,
  getTrendingHashtags,
  searchPosts,
  updatePost,
  togglePin,
  deletePost,
  likePost,
  savePost,
  sharePost,
  getPostLikers,
  getSavedPosts,
} from "../controllers/postController.js";
import {
  listComments,
  addComment,
  likeComment,
  deleteComment,
  setTarget,
} from "../controllers/commentController.js";

const router = express.Router();

router.use(auth);

router.post("/", mediaUpload.array("media", 10), createPost);
router.get("/all", getAllPosts);
router.get("/feed", getAllPosts);
router.get("/explore", getExplorePosts);
router.get("/saved", getSavedPosts);
router.get("/archived", getArchivedPosts);
router.get("/search", searchPosts);
router.get("/trending/hashtags", getTrendingHashtags);
router.get("/hashtag/:tag", getPostsByHashtag);
router.get("/user/:userId", validateId("userId"), getUserPosts);

router.get("/:id", validateId("id"), getPost);
router.put("/:id", validateId("id"), updatePost);
router.delete("/:id", validateId("id"), deletePost);
router.put("/:id/like", validateId("id"), likePost);
router.put("/:id/save", validateId("id"), savePost);
router.put("/:id/pin", validateId("id"), togglePin);
router.post("/:id/share", validateId("id"), sharePost);
router.get("/:id/likes", validateId("id"), getPostLikers);

router.get("/:id/comments", validateId("id"), setTarget("Post"), listComments);
router.post("/:id/comments", validateId("id"), setTarget("Post"), addComment);
router.delete("/:id/comments/:commentId", validateId("id", "commentId"), deleteComment);
router.put("/:id/comments/:commentId/like", validateId("id", "commentId"), likeComment);

export default router;
