import express from "express";
import auth from "../middlewares/authMiddleware.js";
import validateId from "../middlewares/validateId.js";
import { imageUpload } from "../middlewares/upload.js";
import {
  getUserProfile,
  getMe,
  updateUserProfile,
  followUser,
  unfollowUser,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  removeFollower,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  getBlockedUsers,
  toggleMute,
  searchUsers,
  getSuggestions,
  deleteProfileImage,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/search", auth, searchUsers);
router.get("/me", auth, getMe);
router.get("/suggestions", auth, getSuggestions);
router.get("/suggestions/:userId", auth, getSuggestions);
router.get("/requests", auth, getFollowRequests);
router.get("/blocked", auth, getBlockedUsers);

router.put("/follow/:id", auth, validateId("id"), followUser);
router.put("/unfollow/:id", auth, validateId("id"), unfollowUser);
router.put("/requests/:id/accept", auth, validateId("id"), acceptFollowRequest);
router.put("/requests/:id/reject", auth, validateId("id"), rejectFollowRequest);
router.put("/followers/:id/remove", auth, validateId("id"), removeFollower);
router.put("/block/:id", auth, validateId("id"), blockUser);
router.put("/unblock/:id", auth, validateId("id"), unblockUser);
router.put("/mute/:id", auth, validateId("id"), toggleMute);
router.delete("/image/:type", auth, deleteProfileImage);

router.get("/:id/followers", auth, validateId("id"), getFollowers);
router.get("/:id/following", auth, validateId("id"), getFollowing);
router.get("/:id", auth, validateId("id"), getUserProfile);
router.put(
  "/:id",
  auth,
  validateId("id"),
  imageUpload.fields([{ name: "profilePic", maxCount: 1 }, { name: "coverPic", maxCount: 1 }]),
  updateUserProfile
);

export default router;
