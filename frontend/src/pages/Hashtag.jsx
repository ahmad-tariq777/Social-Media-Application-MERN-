import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { FiFilm, FiGrid, FiHash } from "react-icons/fi";
import api from "../api";
import usePaginated from "../hooks/usePaginated";
import PostGrid from "../components/PostGrid";
import Sentinel from "../components/Sentinel";
import "../styles/Explore.css";

export default function Hashtag() {
  const { tag } = useParams();
  const [tab, setTab] = useState("posts");

  const fetchPage = useCallback(
    async (page) => {
      const res = await api.get(`/${tab}/hashtag/${encodeURIComponent(tag)}`, { params: { page, limit: 12 } });
      return { items: res.data[tab], hasMore: res.data.hasMore };
    },
    [tab, tag]
  );
  const { items, loading, hasMore, loadMore } = usePaginated(fetchPage, `${tag}-${tab}`);

  return (
    <div className="explore-page">
      <h2 className="explore-title">
        <FiHash /> {tag}
      </h2>

      <div className="profile-tabs">
        <button className={tab === "posts" ? "active" : ""} onClick={() => setTab("posts")}>
          <FiGrid /> Posts
        </button>
        <button className={tab === "reels" ? "active" : ""} onClick={() => setTab("reels")}>
          <FiFilm /> Reels
        </button>
      </div>

      <PostGrid items={items} kind={tab === "reels" ? "reel" : "post"} />
      {loading && <p className="loading-text">Loading...</p>}
      {!loading && items.length === 0 && <p className="empty-text">No {tab} with #{tag} yet.</p>}
      <Sentinel onVisible={loadMore} disabled={!hasMore || loading} />
    </div>
  );
}
