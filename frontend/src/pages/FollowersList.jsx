import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import usePaginated from "../hooks/usePaginated";
import { sameId } from "../utils/format";
import FollowButton from "../components/FollowButton";
import Sentinel from "../components/Sentinel";
import UserListItem from "../components/UserListItem";
import "../styles/FollowersList.css";

export default function FollowersList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, refreshUser } = useAuth();
  const isOwn = sameId(id, me._id);

  const fetchPage = useCallback(
    async (page) => {
      const res = await api.get(`/users/${id}/followers`, { params: { page, limit: 20 } });
      return { items: res.data.users, hasMore: res.data.hasMore };
    },
    [id]
  );
  const { items, setItems, loading, hasMore, loadMore, error } = usePaginated(fetchPage, id);

  const removeFollower = async (userId) => {
    if (!window.confirm("Remove this follower?")) return;
    try {
      await api.put(`/users/followers/${userId}/remove`);
      setItems((prev) => prev.filter((u) => u._id !== userId));
      refreshUser();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const isFollowing = (userId) => me.following?.some((f) => sameId(f, userId));
  const isRequested = (userId) => me.sentRequests?.some((f) => sameId(f, userId));

  return (
    <div className="followers-page">
      <div className="followers-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
        <h2>Followers</h2>
      </div>

      <div className="followers-list">
        {items.map((f) => (
          <div key={f._id} className="follower-card">
            <UserListItem user={f} subtitle={f.bio || f.name}>
              {isOwn && (
                <button className="remove-btn" onClick={() => removeFollower(f._id)}>
                  Remove
                </button>
              )}
              {!sameId(f, me._id) && (
                <FollowButton
                  userId={f._id}
                  initialFollowing={isFollowing(f._id)}
                  initialRequested={isRequested(f._id)}
                  followBack
                />
              )}
            </UserListItem>
          </div>
        ))}
      </div>

      {loading && <p className="loading-text">Loading followers...</p>}
      {error && !loading && <p className="empty-text">{errMsg(error, "Could not load followers.")}</p>}
      {!loading && !error && items.length === 0 && <p className="empty-text">No followers yet.</p>}
      <Sentinel onVisible={loadMore} disabled={!hasMore || loading} />
    </div>
  );
}
