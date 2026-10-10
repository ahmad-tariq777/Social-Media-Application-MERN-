import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaBookmark, FaHeart, FaRegBookmark, FaRegHeart } from "react-icons/fa";
import { FiEye, FiFlag, FiMessageCircle, FiPlay, FiSend, FiTrash2, FiVolume2, FiVolumeX } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { compact, sameId } from "../utils/format";
import Avatar from "./Avatar";
import CommentModal from "./CommentModal";
import ReportModal from "./ReportModal";
import RichText from "./RichText";
import ShareModal from "./ShareModal";
import UserName from "./UserName";
import "../styles/ReelCard.css";

export default function ReelCard({ reel: initialReel, muted, onToggleMute, onDeleted }) {
  const { user } = useAuth();
  const [reel, setReel] = useState(initialReel);
  const [playing, setPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const videoRef = useRef(null);
  const viewedRef = useRef(false);

  const author = reel.userId || {};
  const isOwner = sameId(author, user._id);

  const patch = (values) => setReel((prev) => ({ ...prev, ...values }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.7 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const handlePlay = () => {
    setPlaying(true);
    if (viewedRef.current) return;
    viewedRef.current = true;
    api
      .post(`/reels/${reel._id}/view`)
      .then((res) => patch({ viewsCount: res.data.viewsCount }))
      .catch(() => {});
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleLike = async () => {
    try {
      const res = await api.put(`/reels/${reel._id}/like`);
      patch({ likedByMe: res.data.liked, likesCount: res.data.likesCount });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const toggleSave = async () => {
    try {
      const res = await api.put(`/reels/${reel._id}/save`);
      patch({ savedByMe: res.data.saved, savesCount: res.data.savesCount });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this reel?")) return;
    try {
      await api.delete(`/reels/${reel._id}`);
      if (onDeleted) onDeleted(reel._id);
    } catch (err) {
      alert(errMsg(err, "Delete failed"));
    }
  };

  return (
    <div className="reel-card">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="reel-video"
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onPlay={handlePlay}
        onPause={() => setPlaying(false)}
      />

      {!playing && (
        <button className="play-overlay" onClick={togglePlay} aria-label="Play">
          <FiPlay size={40} />
        </button>
      )}

      <button className="mute-btn" onClick={onToggleMute} aria-label="Toggle sound">
        {muted ? <FiVolumeX /> : <FiVolume2 />}
      </button>

      <div className="overlay">
        <div className="info">
          <div className="user">
            <Link to={`/profile/${author._id}`} className="reel-author">
              <Avatar src={author.profilePic} alt={author.username} size="sm" className="avatar" />
              <UserName user={author} className="username" />
            </Link>
          </div>
          {reel.caption && (
            <p className="caption">
              <RichText text={reel.caption} mentions={reel.mentions} />
            </p>
          )}
          <span className="reel-views">
            <FiEye /> {compact(reel.viewsCount)}
          </span>
        </div>

        <div className="actions">
          <button onClick={toggleLike} className={`icon-btn ${reel.likedByMe ? "liked" : ""}`}>
            {reel.likedByMe ? <FaHeart size={26} /> : <FaRegHeart size={26} />}
            <span>{compact(reel.likesCount)}</span>
          </button>

          <button className="icon-btn" onClick={() => setShowComments(true)}>
            <FiMessageCircle size={26} />
            <span>{compact(reel.commentsCount)}</span>
          </button>

          <button className="icon-btn" onClick={() => setShowShare(true)}>
            <FiSend size={26} />
            <span>{compact(reel.sharesCount)}</span>
          </button>

          <button className={`icon-btn ${reel.savedByMe ? "saved" : ""}`} onClick={toggleSave}>
            {reel.savedByMe ? <FaBookmark size={24} /> : <FaRegBookmark size={24} />}
          </button>

          {isOwner ? (
            <button className="icon-btn delete-btn" onClick={handleDelete} aria-label="Delete">
              <FiTrash2 size={24} />
            </button>
          ) : (
            <button className="icon-btn" onClick={() => setShowReport(true)} aria-label="Report">
              <FiFlag size={24} />
            </button>
          )}
        </div>
      </div>

      {showComments && (
        <CommentModal
          targetType="reels"
          targetId={reel._id}
          ownerId={author._id}
          disabled={reel.commentsDisabled}
          onCountChange={(delta) => setReel((prev) => ({ ...prev, commentsCount: Math.max((prev.commentsCount || 0) + delta, 0) }))}
          onClose={() => setShowComments(false)}
        />
      )}
      {showShare && <ShareModal kind="reel" id={reel._id} onClose={() => setShowShare(false)} onShared={(sharesCount) => patch({ sharesCount })} />}
      {showReport && <ReportModal targetType="Reel" target={reel._id} onClose={() => setShowReport(false)} />}
    </div>
  );
}
