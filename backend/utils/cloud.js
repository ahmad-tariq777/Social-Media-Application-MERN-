import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const clean = (v) => (v || "").trim().replace(/^["']|["']$/g, "");

const cloudName = clean(process.env.CLOUDINARY_NAME);
const apiKey = clean(process.env.CLOUDINARY_API_KEY);
const apiSecret = clean(process.env.CLOUDINARY_API_SECRET);

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Cloudinary credentials are missing");
} else if (apiSecret.length !== 27) {
  console.error(`CLOUDINARY_API_SECRET has ${apiSecret.length} characters, expected 27. Copy it again from the Cloudinary dashboard.`);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export const uploadBuffer = (buffer, { folder = "social_media", resourceType = "auto" } = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

export const uploadFile = async (file, folder) => {
  const isVideo = file.mimetype.startsWith("video/");
  const result = await uploadBuffer(file.buffer, {
    folder,
    resourceType: isVideo ? "video" : "image",
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    type: isVideo ? "video" : "image",
    duration: result.duration || 0,
    width: result.width,
    height: result.height,
  };
};

export const deleteAsset = async (publicId, type = "image") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: type });
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

export default cloudinary;
