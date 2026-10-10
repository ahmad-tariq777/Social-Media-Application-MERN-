import { useCallback, useState } from "react";
import { FiPlus } from "react-icons/fi";
import api from "../api";
import usePaginated from "../hooks/usePaginated";
import ReelCard from "./ReelCard";
import Sentinel from "./Sentinel";
import UploadReel from "./UploadReel";
import Modal from "./Modal";
import "../styles/ReelsFeed.css";

const TABS = [
  { key: "all", label: "For you", path: "/reels" },
  { key: "trending", label: "Trending", path: "/reels/trending" },
  { key: "following", label: "Following", path: "/reels/following" },
];

export default function ReelsFeed() {
  const [tab, setTab] = useState("all");
  const [muted, setMuted] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchPage = useCallback(
    async (page) => {
      const path = TABS.find((t) => t.key === tab).path;
      const res = await api.get(path, { params: { page, limit: 8 } });
      return { items: res.data.reels, hasMore: res.data.hasMore };
    },
    [tab]
  );

  const { items, setItems, loading, hasMore, loadMore, error } = usePaginated(fetchPage, tab);

  const handleUploaded = (reel) => {
    setShowUpload(false);
    if (tab === "all") setItems((prev) => [reel, ...prev]);
  };

  const handleDeleted = (id) => setItems((prev) => prev.filter((r) => r._id !== id));

  return (
    <div className="reels-feed">
      <div className="reels-toolbar">
        <div className="reels-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <button className="upload-reel-btn" onClick={() => setShowUpload(true)}>
          <FiPlus /> Upload Reel
        </button>
      </div>

      {showUpload && (
        <Modal title="New reel" onClose={() => setShowUpload(false)}>
          <UploadReel onUploaded={handleUploaded} />
        </Modal>
      )}

      <div className="reels-list">
        {items.map((reel) => (
          <ReelCard key={reel._id} reel={reel} muted={muted} onToggleMute={() => setMuted((m) => !m)} onDeleted={handleDeleted} />
        ))}
      </div>

      {loading && <p className="loading-text">Loading reels...</p>}
      {error && !loading && <p className="empty-text">Could not load reels.</p>}
      {!loading && !error && items.length === 0 && <p className="empty-text">No reels here yet.</p>}
      <Sentinel onVisible={loadMore} disabled={!hasMore || loading} />
    </div>
  );
}
