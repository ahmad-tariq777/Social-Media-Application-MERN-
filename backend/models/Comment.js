import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const commentSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["Post", "Reel"], required: true },
    target: { type: ObjectId, required: true, refPath: "targetType" },
    parent: { type: ObjectId, ref: "Comment", default: null },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    mentions: [{ type: ObjectId, ref: "User" }],
    likes: [{ type: ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ target: 1, parent: 1, createdAt: -1 });

export default mongoose.models.Comment || mongoose.model("Comment", commentSchema);
