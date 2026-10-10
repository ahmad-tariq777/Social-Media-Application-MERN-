import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { FiCopy, FiMessageCircle, FiPlay } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { compact, getMedia } from "../utils/format";
import "../styles/Common.css";

export default function PostGrid({ items, kind = "post" }) {
  return (
    <div className="post-grid">
      {items.map((item) => {
        const media = kind === "reel" ? [{ url: item.videoUrl, type: "video" }] : getMedia(item);
        const cover = media[0];
        return (
          <Link key={item._id} to={`/${kind}/${item._id}`} className="grid-tile">
            {cover ? (
              cover.type === "video" ? (
                <video src={cover.url} className="grid-media" muted preload="metadata" />
              ) : (
                <img src={cover.url} className="grid-media" alt="" loading="lazy" />
              )
            ) : (
              <div className="grid-text">{item.caption}</div>
            )}
            <div className="grid-badges">
              {item.isPinned && <BsPinAngleFill />}
              {media.length > 1 && <FiCopy />}
              {cover?.type === "video" && <FiPlay />}
            </div>
            <div className="grid-overlay">
              <span>
                <FaHeart /> {compact(item.likesCount)}
              </span>
              <span>
                <FiMessageCircle /> {compact(item.commentsCount)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
