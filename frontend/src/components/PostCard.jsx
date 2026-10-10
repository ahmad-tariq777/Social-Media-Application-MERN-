import { useState } from "react";
import { Link } from "react-router-dom";
import { FaBookmark, FaHeart, FaRegBookmark, FaRegHeart } from "react-icons/fa";
import { BsPinAngle, BsPinAngleFill } from "react-icons/bs";
import { FiArchive, FiEdit2, FiFlag, FiMapPin, FiMessageCircle, FiMoreHorizontal, FiSend, FiSlash, FiTrash2 } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { compact, getMedia, sameId, timeAgo } from "../utils/format";
import Avatar from "./Avatar";
import CommentSection from "./CommentSection";
import LikersModal from "./LikersModal";
import MediaCarousel from "./MediaCarousel";
import ReportModal from "./ReportModal";
import RichText from "./RichText";
import ShareModal from "./ShareModal";
import UserName from "./UserName";
import "../styles/PostCard.css";

export default function PostCard({ post: initialPost, onDeleted, onRemoved }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialPost.caption || "");
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showLikers, setShowLikers] = useState(false);

  const author = post.userId || {};
  const isOwner = sameId(author, user._id);
  const media = getMedia(post);

  const patch = (values) => setPost((prev) => ({ ...prev, ...values }));

  const toggleLike = async () => {
    try {
      const res = await api.put(`/posts/${post._id}/like`);
      patch({ likedByMe: res.data.liked, likesCount: res.data.likesCount });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const toggleSave = async () => {
    try {
      const res = await api.put(`/posts/${post._id}/save`);
      patch({ savedByMe: res.data.saved, savesCount: res.data.savesCount });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const update = async (values, onSuccess) => {
    try {
      const res = await api.put(`/posts/${post._id}`, values);
      patch({ ...res.data, userId: res.data.userId });
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const saveCaption = () =>
    update({ caption: draft }, () => {
      setEditing(false);
    });

  const toggleArchive = () => {
    setMenuOpen(false);
    update({ isArchived: !post.isArchived }, () => {
      if (onRemoved) onRemoved(post._id);
    });
  };

  const toggleComments = () => {
    setMenuOpen(false);
    update({ commentsDisabled: !post.commentsDisabled });
  };

  const togglePin = async () => {
    setMenuOpen(false);
    try {
      const res = await api.put(`/posts/${post._id}/pin`);
      patch({ isPinned: res.data.isPinned });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const deletePost = async () => {
    setMenuOpen(false);
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      if (onDeleted) onDeleted(post._id);
    } catch (err) {
      alert(errMsg(err, "Failed to delete post"));
    }
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <Link to={`/profile/${author._id}`}>
          <Avatar src={author.profilePic} alt={author.username} size="md" className="avatar" />
        </Link>
        <div className="post-header-text">
          <Link to={`/profile/${author._id}`} className="post-author">
            <UserName user={author} />
          </Link>
          <div className="post-sub">
            {post.location && (
              <span className="post-location">
                <FiMapPin /> {post.location}
              </span>
            )}
            <span className="post-time">{timeAgo(post.createdAt)}</span>
            {post.isPinned && <BsPinAngleFill className="pin-icon" />}
            {post.isArchived && <span className="archived-tag">Archived</span>}
          </div>
        </div>

        <div className="post-menu-wrap">
          <button className="icon-action" onClick={() => setMenuOpen((v) => !v)} aria-label="More">
            <FiMoreHorizontal />
          </button>
          {menuOpen && (
            <div className="post-menu" onMouseLeave={() => setMenuOpen(false)}>
              {isOwner ? (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                  >
                    <FiEdit2 /> Edit caption
                  </button>
                  <button onClick={togglePin}>
                    <BsPinAngle /> {post.isPinned ? "Unpin from profile" : "Pin to profile"}
                  </button>
                  <button onClick={toggleComments}>
                    <FiSlash /> {post.commentsDisabled ? "Turn on comments" : "Turn off comments"}
                  </button>
                  <button onClick={toggleArchive}>
                    <FiArchive /> {post.isArchived ? "Unarchive" : "Archive"}
                  </button>
                  <button className="danger" onClick={deletePost}>
                    <FiTrash2 /> Delete
                  </button>
                </>
              ) : (
                <button
                  className="danger"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowReport(true);
                  }}
                >
                  <FiFlag /> Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="post-body">
        {editing ? (
          <div className="caption-edit">
            <textarea value={draft} maxLength={2200} onChange={(e) => setDraft(e.target.value)} />
            <div className="caption-edit-actions">
              <button className="primary-btn" onClick={saveCaption}>
                Save
              </button>
              <button
                className="secondary-btn"
                onClick={() => {
                  setEditing(false);
                  setDraft(post.caption || "");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          post.caption && (
            <p className="post-caption">
              <RichText text={post.caption} mentions={post.mentions} />
            </p>
          )
        )}
        <MediaCarousel media={media} />
      </div>

      <div className="post-actions">
        <button className={`action-btn ${post.likedByMe ? "liked" : ""}`} onClick={toggleLike} aria-label="Like">
          {post.likedByMe ? <FaHeart /> : <FaRegHeart />}
        </button>
        <button className="action-btn" onClick={() => setShowComments((v) => !v)} aria-label="Comments">
          <FiMessageCircle />
        </button>
        <button className="action-btn" onClick={() => setShowShare(true)} aria-label="Share">
          <FiSend />
        </button>
        <button className={`action-btn save-btn ${post.savedByMe ? "saved" : ""}`} onClick={toggleSave} aria-label="Save">
          {post.savedByMe ? <FaBookmark /> : <FaRegBookmark />}
        </button>
      </div>

      <div className="post-stats">
        <button className="likes-link" onClick={() => post.likesCount > 0 && setShowLikers(true)}>
          {compact(post.likesCount)} {post.likesCount === 1 ? "like" : "likes"}
        </button>
        <button className="comments-link" onClick={() => setShowComments((v) => !v)}>
          {compact(post.commentsCount)} {post.commentsCount === 1 ? "comment" : "comments"}
        </button>
        {post.sharesCount > 0 && <span className="shares-count">{compact(post.sharesCount)} shares</span>}
      </div>

      {showComments && (
        <CommentSection
          targetType="posts"
          targetId={post._id}
          ownerId={author._id}
          disabled={post.commentsDisabled}
          onCountChange={(delta) => setPost((prev) => ({ ...prev, commentsCount: Math.max((prev.commentsCount || 0) + delta, 0) }))}
        />
      )}

      {showReport && <ReportModal targetType="Post" target={post._id} onClose={() => setShowReport(false)} />}
      {showShare && (
        <ShareModal kind="post" id={post._id} onClose={() => setShowShare(false)} onShared={(sharesCount) => patch({ sharesCount })} />
      )}
      {showLikers && <LikersModal kind="post" id={post._id} onClose={() => setShowLikers(false)} />}
    </article>
  );
}
