import express from "express";
import auth from "../middlewares/authMiddleware.js";
import validateId from "../middlewares/validateId.js";
import { listReplies, likeComment, editComment, deleteComment, pinComment } from "../controllers/commentController.js";

const router = express.Router();

router.use(auth);

router.get("/:commentId/replies", validateId("commentId"), listReplies);
router.put("/:commentId/like", validateId("commentId"), likeComment);
router.put("/:commentId/pin", validateId("commentId"), pinComment);
router.put("/:commentId", validateId("commentId"), editComment);
router.delete("/:commentId", validateId("commentId"), deleteComment);

export default router;
