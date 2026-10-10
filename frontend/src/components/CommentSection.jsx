import { useCallback, useState } from "react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import usePaginated from "../hooks/usePaginated";
import Avatar from "./Avatar";
import CommentItem from "./CommentItem";
import "../styles/CommentSection.css";

export default function CommentSection({ targetType, targetId, ownerId, disabled, onCountChange }) {
  const { user } = useAuth();
  const [sort, setSort] = useState("top");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchPage = useCallback(
    async (page) => {
      const res = await api.get(`/${targetType}/${targetId}/comments`, { params: { page, limit: 15, sort } });
      return { items: res.data.comments, hasMore: res.data.hasMore };
    },
    [targetType, targetId, sort]
  );
  const { items, setItems, loading, hasMore, loadMore } = usePaginated(fetchPage, `${targetType}-${targetId}-${sort}`);

  const countChange = useCallback(
    (delta) => {
      if (onCountChange) onCountChange(delta);
    },
    [onCountChange]
  );

  const submit = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await api.post(`/${targetType}/${targetId}/comments`, { text });
      setItems((prev) => {
        const firstFree = prev.findIndex((c) => !c.isPinned);
        const index = firstFree === -1 ? prev.length : firstFree;
        return [...prev.slice(0, index), res.data, ...prev.slice(index)];
      });
      countChange(1);
      setText("");
    } catch (err) {
      alert(errMsg(err, "Failed to add comment"));
    } finally {
      setPosting(false);
    }
  };

  const handleChange = (id, patch) =>
    setItems((prev) =>
      prev
        .map((c) => {
          if (c._id === id) return { ...c, ...patch };
          return patch.isPinned ? { ...c, isPinned: false } : c;
        })
        .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
    );

  const handleRemove = (id, removed) => {
    setItems((prev) => prev.filter((c) => c._id !== id));
    countChange(-removed);
  };

  return (
    <div className="comment-section">
      {disabled ? (
        <p className="comments-off">Comments are turned off.</p>
      ) : (
        <div className="add-comment">
          <Avatar src={user.profilePic} alt={user.username} size="sm" />
          <input
            type="text"
            className="comment-input"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a comment..."
          />
          <button className="comment-send" onClick={submit} disabled={posting || !text.trim()}>
            Post
          </button>
        </div>
      )}

      <div className="comment-sort">
        <button className={sort === "top" ? "active" : ""} onClick={() => setSort("top")}>
          Top
        </button>
        <button className={sort === "new" ? "active" : ""} onClick={() => setSort("new")}>
          Newest
        </button>
      </div>

      <div className="comments-list">
        {items.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            ownerId={ownerId}
            targetType={targetType}
            targetId={targetId}
            disabled={disabled}
            onChange={handleChange}
            onRemove={handleRemove}
            onCountChange={countChange}
          />
        ))}
        {!loading && items.length === 0 && <p className="empty-text">No comments yet.</p>}
        {loading && <p className="loading-text">Loading comments...</p>}
        {hasMore && !loading && (
          <button className="load-more" onClick={loadMore}>
            Load more comments
          </button>
        )}
      </div>
    </div>
  );
}
