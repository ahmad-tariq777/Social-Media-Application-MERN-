import multer from "multer";
import path from "path";

const imageExt = /\.(jpe?g|png|webp|gif|avif)$/i;
const videoExt = /\.(mp4|mov|webm|mkv|ogg)$/i;

const build = (allow, limitMb) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: limitMb * 1024 * 1024, files: 10 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = file.mimetype.startsWith("image/") && imageExt.test(ext);
      const isVideo = file.mimetype.startsWith("video/") && videoExt.test(ext);
      if ((allow.includes("image") && isImage) || (allow.includes("video") && isVideo)) return cb(null, true);
      cb(Object.assign(new Error("Unsupported file type"), { status: 400 }));
    },
  });

export const mediaUpload = build(["image", "video"], 60);
export const imageUpload = build(["image"], 8);
export const videoUpload = build(["video"], 100);
