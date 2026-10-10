import { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { sameId } from "../utils/format";
import FollowButton from "../components/FollowButton";
import UserListItem from "../components/UserListItem";
import "../styles/Suggestions.css";

export default function Suggestions() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/users/suggestions")
      .then((res) => setUsers(res.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const term = search.trim().toLowerCase();
  const filtered = users.filter(
    (u) => !term || u.username.toLowerCase().includes(term) || (u.name || "").toLowerCase().includes(term)
  );

  return (
    <div className="suggestions-page">
      <h2>People You May Know</h2>

      <label className="suggestions-search">
        <FiSearch />
        <input type="text" placeholder="Filter suggestions..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      {loading ? (
        <div className="suggestions-loading">Loading suggestions...</div>
      ) : filtered.length === 0 ? (
        <div className="no-suggestions">No suggestions found.</div>
      ) : (
        <div className="suggestions-grid">
          {filtered.map((user) => (
            <div className="suggestion-card" key={user._id}>
              <UserListItem
                user={user}
                subtitle={user.mutualCount > 0 ? `${user.mutualCount} mutual connection${user.mutualCount > 1 ? "s" : ""}` : user.bio || user.name}
              >
                <FollowButton
                  userId={user._id}
                  initialFollowing={me.following?.some((f) => sameId(f, user._id))}
                  initialRequested={me.sentRequests?.some((f) => sameId(f, user._id))}
                />
              </UserListItem>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
