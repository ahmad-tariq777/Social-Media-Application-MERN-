import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["User", "Post", "Reel", "Comment"], required: true },
    target: { type: ObjectId, required: true, refPath: "targetType" },
    reason: {
      type: String,
      enum: ["spam", "harassment", "hate", "violence", "nudity", "false_information", "other"],
      required: true,
    },
    details: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending" },
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, targetType: 1, target: 1 }, { unique: true });

export default mongoose.models.Report || mongoose.model("Report", reportSchema);
