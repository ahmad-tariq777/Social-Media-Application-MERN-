import express from "express";
import auth from "../middlewares/authMiddleware.js";
import validateId from "../middlewares/validateId.js";
import { mediaUpload } from "../middlewares/upload.js";
import {
  createStory,
  getStoriesFeed,
  getUserStories,
  viewStory,
  getStoryViewers,
  likeStory,
  deleteStory,
} from "../controllers/storyController.js";

const router = express.Router();

router.use(auth);

router.post("/", mediaUpload.single("media"), createStory);
router.get("/", getStoriesFeed);
router.get("/user/:userId", validateId("userId"), getUserStories);
router.post("/:id/view", validateId("id"), viewStory);
router.get("/:id/viewers", validateId("id"), getStoryViewers);
router.put("/:id/like", validateId("id"), likeStory);
router.delete("/:id", validateId("id"), deleteStory);

export default router;
