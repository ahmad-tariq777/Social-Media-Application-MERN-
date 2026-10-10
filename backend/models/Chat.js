import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const chatSchema = new mongoose.Schema(
  {
    members: [{ type: ObjectId, ref: "User" }],
    isGroup: { type: Boolean, default: false },
    name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    admins: [{ type: ObjectId, ref: "User" }],
    lastMessage: { type: ObjectId, ref: "Message", default: null },
    mutedBy: [{ type: ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

chatSchema.index({ members: 1, updatedAt: -1 });

export default mongoose.models.Chat || mongoose.model("Chat", chatSchema);
