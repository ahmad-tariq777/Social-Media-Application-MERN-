import { useState } from "react";
import { Link } from "react-router-dom";
import { BsCheck2, BsCheck2All } from "react-icons/bs";
import { FiCornerUpLeft, FiEdit2, FiFilm, FiMoreHorizontal, FiSmile, FiTrash2 } from "react-icons/fi";
import { formatTime, getMedia, sameId } from "../../utils/format";
import "../../styles/ChatPage.css";

const EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

export default function MessageBubble({ message, mine, meId, isGroup, showSeen, onReply, onReact, onEdit, onDelete }) {
  const [picker, setPicker] = useState(false);
  const [menu, setMenu] = useState(false);

  const sender = message.senderId || {};
  const reactions = message.reactions || [];
  const grouped = reactions.reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || { count: 0, mine: false };
    acc[r.emoji].count += 1;
    if (sameId(r.userId, meId)) acc[r.emoji].mine = true;
    return acc;
  }, {});

  const seen = (message.seenBy || []).length > 1;
  const sharedPostMedia = message.sharedPost ? getMedia(message.sharedPost)[0] : null;

  return (
    <div className={`chat-message-row ${mine ? "sent" : "received"}`}>
      <div className={`chat-message ${mine ? "sent" : "received"} ${message.isDeleted ? "deleted" : ""}`}>
        {isGroup && !mine && <span className="message-sender">{sender.username}</span>}

        {message.replyTo && !message.isDeleted && (
          <div className="message-reply">
            <strong>{message.replyTo.senderId?.username || "User"}</strong>
            <span>{message.replyTo.isDeleted ? "Message deleted" : message.replyTo.text || (message.replyTo.mediaUrl ? "Media" : "")}</span>
          </div>
        )}

        {message.isDeleted ? (
          <span className="message-deleted-text">This message was deleted</span>
        ) : (
          <>
            {message.mediaUrl &&
              (message.mediaType === "video" ? (
                <video src={message.mediaUrl} className="message-media" controls preload="metadata" />
              ) : (
                <img src={message.mediaUrl} className="message-media" alt="" loading="lazy" />
              ))}

            {message.sharedPost && (
              <Link to={`/post/${message.sharedPost._id}`} className="shared-card">
                {sharedPostMedia &&
                  (sharedPostMedia.type === "video" ? (
                    <video src={sharedPostMedia.url} className="shared-media" muted preload="metadata" />
                  ) : (
                    <img src={sharedPostMedia.url} className="shared-media" alt="" />
                  ))}
                <span className="shared-caption">{message.sharedPost.caption || "Shared post"}</span>
              </Link>
            )}

            {message.sharedReel && (
              <Link to={`/reel/${message.sharedReel._id}`} className="shared-card">
                <video src={message.sharedReel.videoUrl} className="shared-media" muted preload="metadata" />
                <span className="shared-caption">
                  <FiFilm /> {message.sharedReel.caption || "Shared reel"}
                </span>
              </Link>
            )}

            {message.text && <p className="message-text">{message.text}</p>}
          </>
        )}

        <div className="message-meta">
          {message.isEdited && !message.isDeleted && <span className="message-edited">edited</span>}
          <span className="message-time">{formatTime(message.createdAt)}</span>
          {mine && !message.isDeleted && (seen ? <BsCheck2All className="seen-icon seen" /> : <BsCheck2 className="seen-icon" />)}
        </div>

        {Object.keys(grouped).length > 0 && (
          <div className="message-reactions">
            {Object.entries(grouped).map(([emoji, info]) => (
              <button key={emoji} className={`reaction-chip ${info.mine ? "mine" : ""}`} onClick={() => onReact(message, emoji)}>
                {emoji} {info.count > 1 && info.count}
              </button>
            ))}
          </div>
        )}

        {showSeen && seen && <span className="seen-label">Seen</span>}
      </div>

      {!message.isDeleted && (
        <div className="message-actions">
          <button onClick={() => onReply(message)} aria-label="Reply">
            <FiCornerUpLeft />
          </button>
          <div className="message-action-wrap">
            <button onClick={() => setPicker((v) => !v)} aria-label="React">
              <FiSmile />
            </button>
            {picker && (
              <div className="emoji-picker" onMouseLeave={() => setPicker(false)}>
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message, emoji);
                      setPicker(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="message-action-wrap">
            <button onClick={() => setMenu((v) => !v)} aria-label="More">
              <FiMoreHorizontal />
            </button>
            {menu && (
              <div className="message-menu" onMouseLeave={() => setMenu(false)}>
                {mine && message.text && (
                  <button
                    onClick={() => {
                      setMenu(false);
                      onEdit(message);
                    }}
                  >
                    <FiEdit2 /> Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    setMenu(false);
                    onDelete(message, "me");
                  }}
                >
                  <FiTrash2 /> Delete for me
                </button>
                {mine && (
                  <button
                    className="danger"
                    onClick={() => {
                      setMenu(false);
                      onDelete(message, "everyone");
                    }}
                  >
                    <FiTrash2 /> Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
