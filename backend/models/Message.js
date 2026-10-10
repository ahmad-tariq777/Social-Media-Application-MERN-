import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: ObjectId, ref: "Chat", required: true, index: true },
    senderId: { type: ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    mediaPublicId: { type: String, default: "" },
    mediaType: { type: String, enum: ["", "image", "video"], default: "" },
    replyTo: { type: ObjectId, ref: "Message", default: null },
    sharedPost: { type: ObjectId, ref: "Post", default: null },
    sharedReel: { type: ObjectId, ref: "Reel", default: null },
    reactions: [
      {
        userId: { type: ObjectId, ref: "User" },
        emoji: String,
        _id: false,
      },
    ],
    seen: { type: Boolean, default: false },
    seenBy: [{ type: ObjectId, ref: "User" }],
    deletedFor: [{ type: ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
