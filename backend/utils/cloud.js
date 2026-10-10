import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
