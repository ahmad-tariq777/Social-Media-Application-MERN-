import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheck, FiTrash2, FiX } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useBadges } from "../context/BadgeContext";
import usePaginated from "../hooks/usePaginated";
import { getMedia, timeAgo } from "../utils/format";
import { socket } from "../utils/socket";
import Avatar from "../components/Avatar";
import Sentinel from "../components/Sentinel";
import UserName from "../components/UserName";
import "../styles/Notifications.css";

const describe = (n) => {
  const target = n.reel ? "reel" : "post";
  switch (n.type) {
    case "like":
      return n.text === "story" ? "liked your story" : `liked your ${target}`;
    case "comment":
      return `commented on your ${target}: "${n.text}"`;
    case "reply":
      return `replied to your comment: "${n.text}"`;
    case "commentLike":
      return "liked your comment";
    case "follow":
      return "started following you";
    case "followRequest":
      return "requested to follow you";
    case "followAccept":
      return "accepted your follow request";
    case "mention":
      return "mentioned you";
    default:
      return "sent you a notification";
  }
};

const destination = (n) => {
  if (n.post) return `/post/${n.post._id || n.post}`;
  if (n.reel) return `/reel/${n.reel._id || n.reel}`;
  return `/profile/${n.sender?._id}`;
};

export default function Notifications() {
  const navigate = useNavigate();
  const { setNotifications } = useBadges();

  const fetchPage = useCallback(
    async (page) => {
      const res = await api.get("/notifications", { params: { page, limit: 20 } });
      setNotifications(res.data.unreadCount);
      return { items: res.data.notifications, hasMore: res.data.hasMore };
    },
    [setNotifications]
  );
  const { items, setItems, loading, hasMore, loadMore } = usePaginated(fetchPage, "notifications");

  useEffect(() => {
    const onNotification = (n) => setItems((prev) => (prev.some((p) => p._id === n._id) ? prev : [n, ...prev]));
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [setItems]);

  const open = async (n) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        setItems((prev) => prev.map((p) => (p._id === n._id ? { ...p, isRead: true } : p)));
        setNotifications((c) => Math.max(c - 1, 0));
      } catch (err) {
        return;
      }
    }
    navigate(destination(n));
  };

  const remove = async (n) => {
    try {
      await api.delete(`/notifications/${n._id}`);
      setItems((prev) => prev.filter((p) => p._id !== n._id));
      if (!n.isRead) setNotifications((c) => Math.max(c - 1, 0));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const markAll = async () => {
    try {
      await api.put("/notifications/read-all");
      setItems((prev) => prev.map((p) => ({ ...p, isRead: true })));
      setNotifications(0);
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await api.delete("/notifications");
      setItems([]);
      setNotifications(0);
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const respond = async (n, action) => {
    try {
      await api.put(`/users/requests/${n.sender._id}/${action}`);
      setItems((prev) => prev.filter((p) => p._id !== n._id));
      if (!n.isRead) setNotifications((c) => Math.max(c - 1, 0));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const thumbnail = (n) => {
    if (n.post) return getMedia(n.post)[0];
    if (n.reel?.videoUrl) return { url: n.reel.videoUrl, type: "video" };
    return null;
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h2>
          <FiBell /> Notifications
        </h2>
        <div className="notifications-actions">
          <button onClick={markAll} disabled={!items.some((n) => !n.isRead)}>
            <FiCheck /> Mark all read
          </button>
          <button onClick={clearAll} disabled={!items.length}>
            <FiTrash2 /> Clear all
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {items.map((n) => {
          const thumb = thumbnail(n);
          return (
            <div key={n._id} className={`notification-item ${n.isRead ? "read" : "unread"}`}>
              <div className="notification-main" onClick={() => open(n)}>
                <Avatar src={n.sender?.profilePic} alt={n.sender?.username} size="md" />
                <div className="notification-text">
                  <p>
                    <UserName user={n.sender} /> {describe(n)}
                  </p>
                  <span className="notification-time">{timeAgo(n.createdAt)}</span>
                </div>
                {thumb &&
                  (thumb.type === "video" ? (
                    <video src={thumb.url} className="notification-thumb" muted preload="metadata" />
                  ) : (
                    <img src={thumb.url} className="notification-thumb" alt="" />
                  ))}
              </div>

              {n.type === "followRequest" ? (
                <div className="notification-requests">
                  <button className="primary-btn" onClick={() => respond(n, "accept")}>
                    Accept
                  </button>
                  <button className="secondary-btn" onClick={() => respond(n, "reject")}>
                    Decline
                  </button>
                </div>
              ) : (
                <button className="notification-remove" onClick={() => remove(n)} aria-label="Delete">
                  <FiX />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {loading && <p className="loading-text">Loading...</p>}
      {!loading && items.length === 0 && <p className="empty-text">You're all caught up.</p>}
      <Sentinel onVisible={loadMore} disabled={!hasMore || loading} />
    </div>
  );
}
