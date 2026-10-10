import { useCallback, useEffect, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { sameId } from "../utils/format";
import Avatar from "./Avatar";
import StoryViewer from "./StoryViewer";
import "../styles/Stories.css";

export default function StoriesBar() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/stories");
      setGroups(res.data);
    } catch (err) {
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append("media", file);
    setUploading(true);
    try {
      await api.post("/stories", formData);
      await load();
    } catch (err) {
      alert(errMsg(err, "Could not upload story"));
    } finally {
      setUploading(false);
    }
  };

  const mine = groups.find((g) => sameId(g.user, user._id));

  return (
    <div className="stories-bar">
      <div className="story-item">
        <button
          className={`story-ring ${mine ? (mine.hasUnseen ? "unseen" : "seen") : "empty"}`}
          onClick={() => (mine ? setViewerIndex(groups.indexOf(mine)) : inputRef.current.click())}
        >
          <Avatar src={user.profilePic} alt="Your story" size="lg" />
        </button>
        <button className="story-add" onClick={() => inputRef.current.click()} disabled={uploading} aria-label="Add story">
          <FiPlus />
        </button>
        <span className="story-name">{uploading ? "Uploading..." : "Your story"}</span>
        <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={upload} />
      </div>

      {groups.map((group, index) =>
        sameId(group.user, user._id) ? null : (
          <div className="story-item" key={group.user._id}>
            <button className={`story-ring ${group.hasUnseen ? "unseen" : "seen"}`} onClick={() => setViewerIndex(index)}>
              <Avatar src={group.user.profilePic} alt={group.user.username} size="lg" />
            </button>
            <span className="story-name">{group.user.username}</span>
          </div>
        )
      )}

      {viewerIndex !== null && (
        <StoryViewer
          initialGroups={groups}
          startGroup={viewerIndex}
          onClose={() => {
            setViewerIndex(null);
            load();
          }}
        />
      )}
    </div>
  );
}
