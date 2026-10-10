import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArchive,
  FiBookmark,
  FiFilm,
  FiGrid,
  FiLink,
  FiLock,
  FiMapPin,
  FiMessageCircle,
  FiMoreHorizontal,
  FiSettings,
  FiSlash,
  FiVolumeX,
  FiFlag,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import usePaginated from "../hooks/usePaginated";
import { compact } from "../utils/format";
import Avatar from "../components/Avatar";
import EditProfileModal from "../components/EditProfileModal";
import FollowButton from "../components/FollowButton";
import PostGrid from "../components/PostGrid";
import ReportModal from "../components/ReportModal";
import Sentinel from "../components/Sentinel";
import "../styles/profile.css";

const TABS = [
  { key: "posts", label: "Posts", icon: FiGrid, kind: "post" },
  { key: "reels", label: "Reels", icon: FiFilm, kind: "reel" },
  { key: "saved", label: "Saved", icon: FiBookmark, kind: "post", ownerOnly: true },
  { key: "savedReels", label: "Saved reels", icon: FiBookmark, kind: "reel", ownerOnly: true },
  { key: "archived", label: "Archived", icon: FiArchive, kind: "post", ownerOnly: true },
];

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, updateUser, refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data);
      setError("");
    } catch (err) {
      setError(errMsg(err, "User not found"));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setTab("posts");
    setMenuOpen(false);
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setMuted(Boolean(me?.muted?.some((m) => String(m) === String(id))));
  }, [id, me?.muted]);

  const isSelf = Boolean(profile?.isSelf);
  const canShow = profile && profile.canView;

  const fetchTab = useCallback(
    async (page) => {
      const params = { page, limit: 12 };
      if (tab === "posts") {
        const res = await api.get(`/posts/user/${id}`, { params });
        return { items: res.data.posts, hasMore: res.data.hasMore };
      }
      if (tab === "reels") {
        const res = await api.get(`/reels/user/${id}`, { params });
        return { items: res.data.reels, hasMore: res.data.hasMore };
      }
      if (tab === "saved") {
        const res = await api.get("/posts/saved", { params });
        return { items: res.data.posts, hasMore: res.data.hasMore };
      }
      if (tab === "savedReels") {
        const res = await api.get("/reels/saved", { params });
        return { items: res.data.reels, hasMore: res.data.hasMore };
      }
      const res = await api.get("/posts/archived", { params });
      return { items: res.data.posts, hasMore: res.data.hasMore };
    },
    [tab, id]
  );

  const tabKey = canShow ? `${id}-${tab}` : null;
  const grid = usePaginated(fetchTab, tabKey);

  const startChat = async () => {
    try {
      const res = await api.post("/chats", { receiverId: profile._id });
      navigate("/chat", { state: { chat: res.data } });
    } catch (err) {
      alert(errMsg(err, "Unable to start chat"));
    }
  };

  const toggleBlock = async () => {
    setMenuOpen(false);
    const blocking = !profile.isBlocked;
    if (blocking && !window.confirm(`Block @${profile.username}?`)) return;
    try {
      await api.put(`/users/${blocking ? "block" : "unblock"}/${profile._id}`);
      await Promise.all([loadProfile(), refreshUser()]);
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const toggleMute = async () => {
    setMenuOpen(false);
    try {
      const res = await api.put(`/users/mute/${profile._id}`);
      setMuted(res.data.muted);
      refreshUser();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleSaved = (updated, close) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    updateUser(updated);
    if (close) {
      setShowEdit(false);
      loadProfile();
    }
  };

  if (loading) return <p className="page-loading">Loading profile...</p>;
  if (!profile) return <p className="empty-text">{error || "User not found"}</p>;

  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isSelf);
  const activeTab = visibleTabs.find((t) => t.key === tab) || visibleTabs[0];
  const unavailable = profile.blockedByThem;

  return (
    <div className="profile-page">
      <div className="cover-section">
        {profile.coverPic ? <img src={profile.coverPic} alt="cover" className="cover-pic" /> : <div className="cover-placeholder" />}
      </div>

      <div className="profile-section">
        <div className="profile-pic-wrapper">
          <Avatar src={profile.profilePic} alt={profile.username} size="xl" className="profile-pic" />
        </div>

        <h2 className="profile-name">
          {profile.name || profile.username}
          {profile.isVerified && <MdVerified className="verified-icon" />}
        </h2>
        <p className="profile-username">@{profile.username}</p>
        {profile.isPrivate && (
          <span className="private-tag">
            <FiLock /> Private
          </span>
        )}

        {!unavailable && (
          <>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.location && (
                <span>
                  <FiMapPin /> {profile.location}
                </span>
              )}
              {profile.website && (
                <a href={/^https?:\/\//.test(profile.website) ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer">
                  <FiLink /> {profile.website}
                </a>
              )}
            </div>

            <div className="follow-info">
              <span>
                <strong>{compact(profile.postsCount)}</strong> Posts
              </span>
              <Link className="clickable" to={`/followers/${profile._id}`}>
                <strong>{compact(profile.followersCount)}</strong> Followers
              </Link>
              <Link className="clickable" to={`/following/${profile._id}`}>
                <strong>{compact(profile.followingCount)}</strong> Following
              </Link>
            </div>
          </>
        )}

        {isSelf ? (
          <div className="profile-actions">
            <button className="edit-btn" onClick={() => setShowEdit(true)}>
              Edit Profile
            </button>
            <Link to="/settings" className="settings-btn">
              <FiSettings /> Settings
            </Link>
          </div>
        ) : unavailable ? (
          <p className="empty-text">This profile is not available.</p>
        ) : profile.isBlocked ? (
          <div className="profile-actions">
            <p className="blocked-note">You blocked this account.</p>
            <button className="edit-btn" onClick={toggleBlock}>
              Unblock
            </button>
          </div>
        ) : (
          <div className="profile-actions">
            <FollowButton
              userId={profile._id}
              initialFollowing={profile.isFollowing}
              initialRequested={profile.isRequested}
              onChange={loadProfile}
            />
            <button className="chat-btn" onClick={startChat}>
              <FiMessageCircle /> Message
            </button>
            <div className="profile-menu-wrap">
              <button className="icon-action" onClick={() => setMenuOpen((v) => !v)} aria-label="More">
                <FiMoreHorizontal />
              </button>
              {menuOpen && (
                <div className="post-menu" onMouseLeave={() => setMenuOpen(false)}>
                  <button onClick={toggleMute}>
                    <FiVolumeX /> {muted ? "Unmute posts" : "Mute posts"}
                  </button>
                  <button className="danger" onClick={toggleBlock}>
                    <FiSlash /> Block
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowReport(true);
                    }}
                  >
                    <FiFlag /> Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!unavailable && !profile.isBlocked && (
        <div className="profile-content">
          {!canShow ? (
            <div className="private-notice">
              <FiLock />
              <p>This account is private. Follow to see their posts.</p>
            </div>
          ) : (
            <>
              <div className="profile-tabs">
                {visibleTabs.map((t) => (
                  <button key={t.key} className={activeTab.key === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
                    <t.icon /> {t.label}
                  </button>
                ))}
              </div>

              <PostGrid items={grid.items} kind={activeTab.kind} />
              {grid.loading && <p className="loading-text">Loading...</p>}
              {!grid.loading && grid.items.length === 0 && <p className="empty-text">Nothing here yet.</p>}
              <Sentinel onVisible={grid.loadMore} disabled={!grid.hasMore || grid.loading} />
            </>
          )}
        </div>
      )}

      {showEdit && <EditProfileModal user={profile} onClose={() => setShowEdit(false)} onSaved={handleSaved} />}
      {showReport && <ReportModal targetType="User" target={profile._id} onClose={() => setShowReport(false)} />}
    </div>
  );
}
