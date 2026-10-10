import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const storySchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    publicId: String,
    caption: { type: String, default: "", maxlength: 200 },
    viewers: [{ type: ObjectId, ref: "User" }],
    likes: [{ type: ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export default mongoose.models.Story || mongoose.model("Story", storySchema);
