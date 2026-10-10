import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiHash, FiTrendingUp } from "react-icons/fi";
import api from "../api";
import usePaginated from "../hooks/usePaginated";
import PostGrid from "../components/PostGrid";
import Sentinel from "../components/Sentinel";
import "../styles/Explore.css";

export default function Explore() {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    api
      .get("/posts/trending/hashtags")
      .then((res) => setTags(res.data))
      .catch(() => setTags([]));
  }, []);

  const fetchPage = useCallback(async (page) => {
    const res = await api.get("/posts/explore", { params: { page, limit: 12 } });
    return { items: res.data.posts, hasMore: res.data.hasMore };
  }, []);
  const { items, loading, hasMore, loadMore } = usePaginated(fetchPage, "explore");

  return (
    <div className="explore-page">
      <h2 className="explore-title">
        <FiTrendingUp /> Explore
      </h2>

      {tags.length > 0 && (
        <div className="trending-tags">
          {tags.map((t) => (
            <Link key={t.tag} to={`/hashtag/${t.tag}`} className="trending-tag">
              <FiHash />
              {t.tag}
              <span className="trending-count">{t.count}</span>
            </Link>
          ))}
        </div>
      )}

      <PostGrid items={items} />
      {loading && <p className="loading-text">Loading...</p>}
      {!loading && items.length === 0 && <p className="empty-text">Nothing to explore yet.</p>}
      <Sentinel onVisible={loadMore} disabled={!hasMore || loading} />
    </div>
  );
}
