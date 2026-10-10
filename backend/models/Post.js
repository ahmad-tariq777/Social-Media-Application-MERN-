import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    type: { type: String, enum: ["image", "video"], default: "image" },
    width: Number,
    height: Number,
    duration: Number,
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    caption: { type: String, default: "", maxlength: 2200 },
    media: [mediaSchema],
    imageUrl: String,
    videoUrl: String,
    hashtags: [{ type: String, index: true }],
    mentions: [{ type: ObjectId, ref: "User" }],
    location: { type: String, default: "" },
    likes: [{ type: ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    commentsDisabled: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ caption: "text" });

export default mongoose.models.Post || mongoose.model("Post", postSchema);
