import express from "express";
import auth from "../middlewares/authMiddleware.js";
import validateId from "../middlewares/validateId.js";
import {
  createChat,
  createGroupChat,
  getUserChats,
  findChat,
  getChat,
  updateGroup,
  leaveGroup,
  toggleMuteChat,
  clearChatForMe,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(auth);

router.post("/", createChat);
router.post("/group", createGroupChat);
router.get("/", getUserChats);
router.get("/find/:firstId/:secondId", validateId("firstId", "secondId"), findChat);
router.get("/detail/:chatId", validateId("chatId"), getChat);
router.put("/group/:chatId", validateId("chatId"), updateGroup);
router.put("/group/:chatId/leave", validateId("chatId"), leaveGroup);
router.put("/:chatId/mute", validateId("chatId"), toggleMuteChat);
router.delete("/:chatId/clear", validateId("chatId"), clearChatForMe);
router.get("/:userId", validateId("userId"), getUserChats);

export default router;
