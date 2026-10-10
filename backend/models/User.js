import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    name: { type: String, default: "", maxlength: 60 },
    profilePic: { type: String, default: "" },
    coverPic: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 150 },
    website: { type: String, default: "", maxlength: 200 },
    location: { type: String, default: "", maxlength: 80 },
    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    followers: [{ type: ObjectId, ref: "User" }],
    following: [{ type: ObjectId, ref: "User" }],
    followRequests: [{ type: ObjectId, ref: "User" }],
    sentRequests: [{ type: ObjectId, ref: "User" }],
    blocked: [{ type: ObjectId, ref: "User" }],
    muted: [{ type: ObjectId, ref: "User" }],
    savedPosts: [{ type: ObjectId, ref: "Post" }],
    savedReels: [{ type: ObjectId, ref: "Reel" }],
    lastSeen: { type: Date, default: Date.now },
    showOnlineStatus: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ username: "text", name: "text" });

export default mongoose.models.User || mongoose.model("User", userSchema);
