import express from "express";
import auth from "../middlewares/authMiddleware.js";
import validateId from "../middlewares/validateId.js";
import { mediaUpload } from "../middlewares/upload.js";
import {
  addMessage,
  getMessages,
  markChatSeen,
  reactToMessage,
  editMessage,
  deleteMessage,
  getUnreadTotal,
} from "../controllers/messageController.js";

const router = express.Router();

router.use(auth);

router.post("/", mediaUpload.single("file"), addMessage);
router.get("/unread/total", getUnreadTotal);
router.put("/seen/:chatId", validateId("chatId"), markChatSeen);
router.put("/:messageId/react", validateId("messageId"), reactToMessage);
router.put("/:messageId", validateId("messageId"), editMessage);
router.delete("/:messageId", validateId("messageId"), deleteMessage);
router.get("/:chatId", validateId("chatId"), getMessages);

export default router;
