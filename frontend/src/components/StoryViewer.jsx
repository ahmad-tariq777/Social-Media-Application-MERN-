import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiEye, FiTrash2, FiX } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { sameId, timeAgo } from "../utils/format";
import Avatar from "./Avatar";
import UserName from "./UserName";
import "../styles/Stories.css";

const IMAGE_DURATION = 5000;

export default function StoryViewer({ initialGroups, startGroup, onClose }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState(initialGroups);
  const [groupIndex, setGroupIndex] = useState(startGroup);
  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewers, setViewers] = useState(null);
  const videoRef = useRef(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isMine = group && sameId(group.user, user._id);

  const next = useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) setStoryIndex(storyIndex + 1);
    else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else onClose();
  }, [group, groups.length, groupIndex, storyIndex, onClose]);

  const prev = useCallback(() => {
    if (storyIndex > 0) setStoryIndex(storyIndex - 1);
    else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    }
  }, [groups, groupIndex, storyIndex]);

  useEffect(() => {
    if (!story || isMine || story.viewedByMe) return;
    api.post(`/stories/${story._id}/view`).catch(() => {});
    setGroups((prevGroups) =>
      prevGroups.map((g, gi) =>
        gi !== groupIndex ? g : { ...g, stories: g.stories.map((s) => (s._id === story._id ? { ...s, viewedByMe: true } : s)) }
      )
    );
  }, [story, isMine, groupIndex]);

  useEffect(() => {
    setViewers(null);
  }, [story?._id]);

  useEffect(() => {
    if (!story || paused || story.mediaType === "video") return undefined;
    const timer = setTimeout(next, IMAGE_DURATION);
    return () => clearTimeout(timer);
  }, [story, paused, next]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else video.play().catch(() => {});
  }, [paused, story]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  if (!story) return null;

  const toggleLike = async () => {
    try {
      const res = await api.put(`/stories/${story._id}/like`);
      setGroups((prevGroups) =>
        prevGroups.map((g, gi) =>
          gi !== groupIndex ? g : { ...g, stories: g.stories.map((s) => (s._id === story._id ? { ...s, likedByMe: res.data.liked } : s)) }
        )
      );
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this story?")) return;
    setPaused(true);
    try {
      await api.delete(`/stories/${story._id}`);
      const remaining = group.stories.filter((s) => s._id !== story._id);
      if (!remaining.length) {
        onClose();
        return;
      }
      setGroups((prevGroups) => prevGroups.map((g, gi) => (gi === groupIndex ? { ...g, stories: remaining } : g)));
      setStoryIndex(Math.min(storyIndex, remaining.length - 1));
      setPaused(false);
    } catch (err) {
      alert(errMsg(err));
      setPaused(false);
    }
  };

  const showViewers = async () => {
    setPaused(true);
    try {
      const res = await api.get(`/stories/${story._id}/viewers`);
      setViewers(res.data);
    } catch (err) {
      alert(errMsg(err));
    }
  };

  return createPortal(
    <div className="story-viewer">
      <div className="story-frame">
        <div className="story-progress">
          {group.stories.map((s, i) => (
            <span
              key={`${s._id}-${i === storyIndex ? "active" : "idle"}`}
              className={`story-progress-segment ${i < storyIndex ? "done" : i === storyIndex ? "active" : "upcoming"} ${
                paused && i === storyIndex ? "paused" : ""
              } ${i === storyIndex ? s.mediaType : ""}`.trim()}
            />
          ))}
        </div>

        <div className="story-header">
          <Avatar src={group.user.profilePic} alt={group.user.username} size="sm" />
          <UserName user={group.user} />
          <span className="story-time">{timeAgo(story.createdAt)}</span>
          <button className="story-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div
          className="story-media-wrap"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => !viewers && setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => !viewers && setPaused(false)}
        >
          {story.mediaType === "video" ? (
            <video
              key={story._id}
              ref={videoRef}
              src={story.mediaUrl}
              className="story-media"
              autoPlay
              playsInline
              onEnded={next}
            />
          ) : (
            <img key={story._id} src={story.mediaUrl} className="story-media" alt="" />
          )}
          {story.caption && <p className="story-caption">{story.caption}</p>}
        </div>

        <button className="story-nav story-prev" onClick={prev} aria-label="Previous">
          <FiChevronLeft />
        </button>
        <button className="story-nav story-next" onClick={next} aria-label="Next">
          <FiChevronRight />
        </button>

        <div className="story-footer">
          {isMine ? (
            <>
              <button className="story-action" onClick={showViewers}>
                <FiEye /> {story.viewersCount}
              </button>
              <button className="story-action danger" onClick={remove}>
                <FiTrash2 />
              </button>
            </>
          ) : (
            <button className={`story-action ${story.likedByMe ? "liked" : ""}`} onClick={toggleLike}>
              {story.likedByMe ? <FaHeart /> : <FaRegHeart />}
            </button>
          )}
        </div>

        {viewers && (
          <div className="story-viewers">
            <div className="story-viewers-header">
              <h4>Viewers ({viewers.viewers.length})</h4>
              <button
                onClick={() => {
                  setViewers(null);
                  setPaused(false);
                }}
              >
                <FiX />
              </button>
            </div>
            <div className="story-viewers-list">
              {viewers.viewers.length === 0 && <p className="empty-text">No views yet.</p>}
              {viewers.viewers.map((v) => (
                <div className="story-viewer-row" key={v._id}>
                  <Avatar src={v.profilePic} alt={v.username} size="sm" />
                  <UserName user={v} />
                  {viewers.likes.some((id) => sameId(id, v._id)) && <FaHeart className="story-liked-by" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
