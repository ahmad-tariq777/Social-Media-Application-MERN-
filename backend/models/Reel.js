import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const reelSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    videoUrl: { type: String, required: true },
    videoPublicId: String,
    caption: { type: String, default: "", maxlength: 2200 },
    hashtags: [{ type: String, index: true }],
    mentions: [{ type: ObjectId, ref: "User" }],
    duration: Number,
    likes: [{ type: ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    commentsDisabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reelSchema.index({ createdAt: -1 });
reelSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Reel || mongoose.model("Reel", reelSchema);
