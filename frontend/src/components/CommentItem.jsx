import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { FiCornerDownRight, FiEdit2, FiTrash2 } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { BsPinAngleFill, BsPinAngle } from "react-icons/bs";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import usePaginated from "../hooks/usePaginated";
import { sameId, timeAgo } from "../utils/format";
import Avatar from "./Avatar";
import RichText from "./RichText";
import UserName from "./UserName";
import "../styles/CommentSection.css";

export default function CommentItem({
  comment,
  isReply = false,
  ownerId,
  targetType,
  targetId,
  disabled,
  onChange,
  onRemove,
  onReply,
  onCountChange,
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const [expanded, setExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const author = comment.userId || {};
  const isAuthor = sameId(author, user._id);
  const isOwner = sameId(ownerId, user._id);

  const fetchReplies = useCallback(
    async (page) => {
      const res = await api.get(`/comments/${comment._id}/replies`, { params: { page, limit: 10 } });
      return { items: res.data.replies, hasMore: res.data.hasMore };
    },
    [comment._id]
  );
  const replies = usePaginated(fetchReplies, expanded && !isReply ? comment._id : null);

  const toggleLike = async () => {
    try {
      const res = await api.put(`/comments/${comment._id}/like`);
      onChange(comment._id, { likedByMe: res.data.liked, likesCount: res.data.likesCount });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const saveEdit = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      const res = await api.put(`/comments/${comment._id}`, { text: draft });
      onChange(comment._id, { text: res.data.text, isEdited: true, mentions: res.data.mentions });
      setEditing(false);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await api.delete(`/comments/${comment._id}`);
      onRemove(comment._id, res.data.removed || 1);
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const togglePin = async () => {
    try {
      const res = await api.put(`/comments/${comment._id}/pin`);
      onChange(comment._id, { isPinned: res.data.isPinned });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const openReply = (target) => {
    setReplyOpen(true);
    setReplyText(`@${(target.userId || {}).username || ""} `);
  };

  const submitReply = async () => {
    if (!replyText.trim() || busy) return;
    setBusy(true);
    try {
      const res = await api.post(`/${targetType}/${targetId}/comments`, { text: replyText, parentId: comment._id });
      if (expanded) replies.setItems((prev) => [...prev, res.data]);
      else setExpanded(true);
      onChange(comment._id, { repliesCount: (comment.repliesCount || 0) + 1 });
      onCountChange(1);
      setReplyText("");
      setReplyOpen(false);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReplyChange = (id, patch) =>
    replies.setItems((prev) => prev.map((r) => (r._id === id ? { ...r, ...patch } : r)));

  const handleReplyRemove = (id, removed) => {
    replies.setItems((prev) => prev.filter((r) => r._id !== id));
    onChange(comment._id, { repliesCount: Math.max((comment.repliesCount || 0) - removed, 0) });
    onCountChange(-removed);
  };

  return (
    <div className={`comment-item ${isReply ? "reply-item" : ""}`}>
      <div className="comment-top">
        <Link to={`/profile/${author._id}`}>
          <Avatar src={author.profilePic} alt={author.username} size="sm" className="comment-avatar" />
        </Link>
        <div className="comment-content">
          {comment.isPinned && (
            <span className="comment-pinned">
              <BsPinAngleFill /> Pinned
            </span>
          )}

          {editing ? (
            <div className="comment-edit">
              <input
                value={draft}
                maxLength={1000}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                autoFocus
              />
              <button className="meta-btn" onClick={saveEdit} disabled={busy}>
                Save
              </button>
              <button
                className="meta-btn"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.text);
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="comment-text">
              <Link to={`/profile/${author._id}`} className="comment-username">
                <UserName user={author} />
              </Link>{" "}
              <RichText text={comment.text} mentions={comment.mentions} />
              {comment.isEdited && <span className="comment-edited"> (edited)</span>}
            </div>
          )}

          <div className="comment-meta">
            <span className="comment-time">{timeAgo(comment.createdAt)}</span>
            <button className={`meta-btn like-btn ${comment.likedByMe ? "liked" : ""}`} onClick={toggleLike}>
              {comment.likedByMe ? <FaHeart /> : <FaRegHeart />}
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
            </button>
            {!disabled && (
              <button className="meta-btn" onClick={() => (isReply ? onReply(comment) : openReply(comment))}>
                Reply
              </button>
            )}
            {isOwner && !isReply && (
              <button className="meta-btn" onClick={togglePin} title={comment.isPinned ? "Unpin" : "Pin"}>
                {comment.isPinned ? <BsPinAngleFill /> : <BsPinAngle />}
              </button>
            )}
            {isAuthor && (
              <button className="meta-btn" onClick={() => setEditing(true)} title="Edit">
                <FiEdit2 />
              </button>
            )}
            {(isAuthor || isOwner) && (
              <button className="meta-btn delete" onClick={remove} title="Delete">
                <FiTrash2 />
              </button>
            )}
          </div>

          {!isReply && comment.repliesCount > 0 && (
            <button className="view-replies" onClick={() => setExpanded((v) => !v)}>
              <FiCornerDownRight />
              {expanded ? "Hide replies" : `View ${comment.repliesCount} ${comment.repliesCount === 1 ? "reply" : "replies"}`}
            </button>
          )}

          {replyOpen && !isReply && (
            <div className="reply-box">
              <input
                value={replyText}
                maxLength={1000}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitReply()}
                placeholder="Write a reply..."
                autoFocus
              />
              <button className="meta-btn" onClick={submitReply} disabled={busy}>
                Send
              </button>
              <button className="meta-btn" onClick={() => setReplyOpen(false)}>
                Cancel
              </button>
            </div>
          )}

          {!isReply && expanded && (
            <div className="replies">
              {replies.items.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  isReply
                  ownerId={ownerId}
                  targetType={targetType}
                  targetId={targetId}
                  disabled={disabled}
                  onChange={handleReplyChange}
                  onRemove={handleReplyRemove}
                  onReply={openReply}
                  onCountChange={onCountChange}
                />
              ))}
              {replies.loading && <p className="loading-text">Loading replies...</p>}
              {replies.hasMore && !replies.loading && (
                <button className="view-replies" onClick={replies.loadMore}>
                  Load more replies
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
