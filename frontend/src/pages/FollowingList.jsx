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
import "../styles/FollowingList.css";

export default function FollowingList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const fetchPage = useCallback(
    async (page) => {
      const res = await api.get(`/users/${id}/following`, { params: { page, limit: 20 } });
      return { items: res.data.users, hasMore: res.data.hasMore };
    },
    [id]
  );
  const { items, loading, hasMore, loadMore, error } = usePaginated(fetchPage, id);

  const isFollowing = (userId) => me.following?.some((f) => sameId(f, userId));
  const isRequested = (userId) => me.sentRequests?.some((f) => sameId(f, userId));

  return (
    <div className="following-page">
      <div className="following-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
        <h2>Following</h2>
      </div>

      <div className="following-list">
        {items.map((f) => (
          <div key={f._id} className="following-card">
            <UserListItem user={f} subtitle={f.bio || f.name}>
              {!sameId(f, me._id) && (
                <FollowButton userId={f._id} initialFollowing={isFollowing(f._id)} initialRequested={isRequested(f._id)} />
              )}
            </UserListItem>
          </div>
        ))}
      </div>

      {loading && <p className="loading-text">Loading following...</p>}
      {error && !loading && <p className="empty-text">{errMsg(error, "Could not load following.")}</p>}
      {!loading && !error && items.length === 0 && <p className="empty-text">Not following anyone yet.</p>}
      <Sentinel onVisible={loadMore} disabled={!hasMore || loading} />
    </div>
  );
}
