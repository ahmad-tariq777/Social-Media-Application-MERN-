import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: ObjectId, ref: "User", required: true, index: true },
    sender: { type: ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["like", "comment", "reply", "commentLike", "follow", "followRequest", "followAccept", "mention"],
      required: true,
    },
    post: { type: ObjectId, ref: "Post", default: null },
    reel: { type: ObjectId, ref: "Reel", default: null },
    comment: { type: ObjectId, ref: "Comment", default: null },
    text: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
