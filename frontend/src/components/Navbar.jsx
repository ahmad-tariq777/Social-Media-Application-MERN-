import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCompass,
  FiFilm,
  FiGlobe,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageCircle,
  FiSearch,
  FiSettings,
  FiUserPlus,
  FiX,
  FiHash,
} from "react-icons/fi";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useBadges } from "../context/BadgeContext";
import useDebounce from "../hooks/useDebounce";
import Avatar from "./Avatar";
import UserName from "./UserName";
import "../styles/Navbar.css";

const linkClass = ({ isActive }) => `icon-btn ${isActive ? "active" : ""}`.trim();

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, messages } = useBadges();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], hashtags: [] });
  const [focused, setFocused] = useState(false);
  const searchRef = useRef(null);
  const debounced = useDebounce(query.trim());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setFocused(false);
  }, [location.pathname]);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults({ users: [], hashtags: [] });
      return undefined;
    }
    let cancelled = false;
    api
      .get("/search", { params: { q: debounced } })
      .then((res) => {
        if (!cancelled) setResults({ users: res.data.users.slice(0, 5), hashtags: res.data.hashtags.slice(0, 4) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setFocused(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const pick = (path) => {
    setQuery("");
    setFocused(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const hasResults = results.users.length > 0 || results.hashtags.length > 0;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/feed" className="logo">
          <FiGlobe size={28} />
        </Link>
      </div>

      <div className="navbar-center">
        <form className="search-bar" ref={searchRef} onSubmit={submitSearch}>
          <FiSearch size={18} />
          <input
            type="text"
            placeholder="Search people, #tags, posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery("")}>
              <FiX />
            </button>
          )}
          {focused && hasResults && (
            <div className="search-results">
              {results.users.map((u) => (
                <div key={u._id} className="search-result-item" onClick={() => pick(`/profile/${u._id}`)}>
                  <Avatar src={u.profilePic} alt={u.username} size="sm" />
                  <div className="search-result-text">
                    <UserName user={u} />
                    {u.name && <span className="search-result-sub">{u.name}</span>}
                  </div>
                </div>
              ))}
              {results.hashtags.map((h) => (
                <div key={h.tag} className="search-result-item" onClick={() => pick(`/hashtag/${h.tag}`)}>
                  <span className="search-hash-icon">
                    <FiHash />
                  </span>
                  <div className="search-result-text">
                    <span>#{h.tag}</span>
                    <span className="search-result-sub">{h.count} posts</span>
                  </div>
                </div>
              ))}
              <button type="submit" className="search-all">
                See all results for "{query.trim()}"
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="navbar-right">
        <NavLink to="/feed" className={linkClass} title="Feed">
          <FiHome size={20} />
        </NavLink>
        <NavLink to="/explore" className={linkClass} title="Explore">
          <FiCompass size={20} />
        </NavLink>
        <NavLink to="/reels" className={linkClass} title="Reels">
          <FiFilm size={20} />
        </NavLink>
        <NavLink to="/suggestions" className={linkClass} title="Suggestions">
          <FiUserPlus size={20} />
        </NavLink>
        <NavLink to="/chat" className={linkClass} title="Messages">
          <FiMessageCircle size={20} />
          {messages > 0 && <span className="badge">{messages > 99 ? "99+" : messages}</span>}
        </NavLink>
        <NavLink to="/notifications" className={linkClass} title="Notifications">
          <FiBell size={20} />
          {notifications > 0 && <span className="badge">{notifications > 99 ? "99+" : notifications}</span>}
        </NavLink>
        <NavLink to={`/profile/${user._id}`} className={linkClass} title="Profile">
          <Avatar src={user.profilePic} alt={user.username} size="xs" />
        </NavLink>
        <NavLink to="/settings" className={linkClass} title="Settings">
          <FiSettings size={20} />
        </NavLink>
        <button className="icon-btn logout-icon" onClick={handleLogout} title="Logout">
          <FiLogOut size={20} />
        </button>
        <button className="menu-toggle" onClick={() => setMenuOpen((prev) => !prev)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      <div className={`navbar-middle ${menuOpen ? "show" : ""}`}>
        <Link to="/feed" className="nav-link">
          <FiHome size={20} />
          <span>Feed</span>
        </Link>
        <Link to="/explore" className="nav-link">
          <FiCompass size={20} />
          <span>Explore</span>
        </Link>
        <Link to="/reels" className="nav-link">
          <FiFilm size={20} />
          <span>Reels</span>
        </Link>
        <Link to="/suggestions" className="nav-link">
          <FiUserPlus size={20} />
          <span>Suggestions</span>
        </Link>
        <Link to="/chat" className="nav-link">
          <FiMessageCircle size={20} />
          <span>Messages</span>
        </Link>
        <Link to="/notifications" className="nav-link">
          <FiBell size={20} />
          <span>Notifications</span>
        </Link>
        <Link to={`/profile/${user._id}`} className="nav-link">
          <Avatar src={user.profilePic} alt={user.username} size="xs" />
          <span>Profile</span>
        </Link>
        <Link to="/settings" className="nav-link">
          <FiSettings size={20} />
          <span>Settings</span>
        </Link>
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
