import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { imageUpload } from "../middlewares/upload.js";
import asyncHandler from "../utils/asyncHandler.js";
import httpError from "../utils/httpError.js";
import cloudinary, { uploadFile, deleteAsset } from "../utils/cloud.js";

const router = express.Router();

router.use(auth);

router.get("/signature", (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "social_media/direct";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_NAME,
  });
});

router.post(
  "/",
  imageUpload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, "No image uploaded");
    const uploaded = await uploadFile(req.file, "social_media/uploads");
    res.json({ url: uploaded.url, publicId: uploaded.publicId });
  })
);

router.put(
  "/",
  imageUpload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, "No image uploaded");
    if (req.body.oldPublicId) await deleteAsset(req.body.oldPublicId, "image");
    const uploaded = await uploadFile(req.file, "social_media/uploads");
    res.json({ url: uploaded.url, publicId: uploaded.publicId });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { publicId } = req.body;
    if (!publicId) throw httpError(400, "publicId is required");
    await deleteAsset(publicId, req.body.type === "video" ? "video" : "image");
    res.json({ message: "Deleted successfully" });
  })
);

export default router;
