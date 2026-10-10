import { useEffect, useRef, useState } from "react";
import { FiImage, FiMapPin, FiX } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import "../styles/Createpost.css";

const MAX_FILES = 10;

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef([]);

  itemsRef.current = items;

  useEffect(
    () => () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    },
    []
  );

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";
    const valid = selected.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (valid.length !== selected.length) alert("Only image and video files are allowed");
    const room = MAX_FILES - items.length;
    if (valid.length > room) alert(`You can attach up to ${MAX_FILES} files`);
    const next = valid.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setItems((prev) => [...prev, ...next]);
  };

  const removeItem = (index) => {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !items.length) {
      alert("Please add a caption or upload media");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("location", location);
      formData.append("commentsDisabled", String(commentsDisabled));
      items.forEach((item) => formData.append("media", item.file));
      const res = await api.post("/posts", formData);
      items.forEach((item) => URL.revokeObjectURL(item.url));
      setCaption("");
      setLocation("");
      setCommentsDisabled(false);
      setItems([]);
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      alert(errMsg(err, "Failed to create post"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-card">
      <div className="create-post-top">
        <Avatar src={user?.profilePic} alt={user?.username} size="md" />
        <textarea
          className="caption-input"
          placeholder="What's happening? Use #tags and @mentions"
          value={caption}
          maxLength={2200}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      {items.length > 0 && (
        <div className="preview-list">
          {items.map((item, index) => (
            <div className="preview" key={item.url}>
              <button type="button" className="remove-btn" onClick={() => removeItem(index)}>
                <FiX />
              </button>
              {item.file.type.startsWith("video/") ? (
                <video src={item.url} className="preview-media" muted />
              ) : (
                <img src={item.url} alt="Preview" className="preview-media" />
              )}
            </div>
          ))}
        </div>
      )}

      <label className="location-input">
        <FiMapPin />
        <input
          type="text"
          placeholder="Add location"
          value={location}
          maxLength={100}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>

      <div className="actions">
        <label className="file-upload">
          <input type="file" accept="image/*,video/*" multiple onChange={handleFiles} />
          <FiImage /> Photo / Video
        </label>
        <label className="toggle-comments">
          <input type="checkbox" checked={commentsDisabled} onChange={(e) => setCommentsDisabled(e.target.checked)} />
          Turn off comments
        </label>
        <button onClick={handleSubmit} disabled={loading} className="post-btn">
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
