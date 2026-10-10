import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiHash } from "react-icons/fi";
import api from "../api";
import PostGrid from "../components/PostGrid";
import UserListItem from "../components/UserListItem";
import "../styles/Explore.css";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const [results, setResults] = useState({ users: [], hashtags: [], posts: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults({ users: [], hashtags: [], posts: [] });
      return;
    }
    setLoading(true);
    api
      .get("/search", { params: { q } })
      .then((res) => setResults(res.data))
      .catch(() => setResults({ users: [], hashtags: [], posts: [] }))
      .finally(() => setLoading(false));
  }, [q]);

  const empty = !results.users.length && !results.hashtags.length && !results.posts.length;

  return (
    <div className="explore-page">
      <h2 className="explore-title">Results for "{q}"</h2>

      {loading && <p className="loading-text">Searching...</p>}
      {!loading && empty && <p className="empty-text">Nothing found.</p>}

      {results.users.length > 0 && (
        <section className="search-section">
          <h3>People</h3>
          {results.users.map((u) => (
            <UserListItem key={u._id} user={u} />
          ))}
        </section>
      )}

      {results.hashtags.length > 0 && (
        <section className="search-section">
          <h3>Hashtags</h3>
          <div className="trending-tags">
            {results.hashtags.map((t) => (
              <Link key={t.tag} to={`/hashtag/${t.tag}`} className="trending-tag">
                <FiHash />
                {t.tag}
                <span className="trending-count">{t.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.posts.length > 0 && (
        <section className="search-section">
          <h3>Posts</h3>
          <PostGrid items={results.posts} />
        </section>
      )}
    </div>
  );
}
