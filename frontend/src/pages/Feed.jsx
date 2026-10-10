import { useCallback } from "react";
import api from "../api";
import usePaginated from "../hooks/usePaginated";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import Sentinel from "../components/Sentinel";
import StoriesBar from "../components/StoriesBar";
import "../styles/Feed.css";

export default function Feed() {
  const fetchPage = useCallback(async (page) => {
    const res = await api.get("/posts/feed", { params: { page, limit: 10 } });
    return { items: res.data.posts, hasMore: res.data.hasMore };
  }, []);

  const { items, setItems, loading, hasMore, loadMore, error } = usePaginated(fetchPage, "feed");

  const handleNewPost = (post) => setItems((prev) => [post, ...prev]);
  const handleRemoved = (id) => setItems((prev) => prev.filter((p) => p._id !== id));

  return (
    <div className="feed">
      <StoriesBar />

      <div className="feed-create">
        <CreatePost onPostCreated={handleNewPost} />
      </div>

      {items.map((post) => (
        <PostCard key={post._id} post={post} onDeleted={handleRemoved} onRemoved={handleRemoved} />
      ))}

      {loading && <div className="loading">Loading...</div>}
      {error && !loading && <div className="no-posts">Could not load the feed.</div>}
      {!loading && !error && items.length === 0 && <div className="no-posts">No posts yet. Follow people to fill your feed.</div>}
      {!loading && !hasMore && items.length > 0 && <div className="end">You're all caught up</div>}
      <Sentinel onVisible={loadMore} disabled={!hasMore || loading} />
    </div>
  );
}
