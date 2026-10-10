import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import UserListItem from "../components/UserListItem";
import "../styles/Settings.css";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  useEffect(() => {
    api
      .get("/users/blocked")
      .then((res) => setBlocked(res.data))
      .catch(() => setBlocked([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (field) => {
    setSaving(field);
    try {
      const res = await api.put(`/users/${user._id}`, { [field]: !user[field] });
      updateUser({ [field]: res.data[field] });
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setSaving("");
    }
  };

  const unblock = async (id) => {
    try {
      await api.put(`/users/unblock/${id}`);
      setBlocked((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <section className="settings-section">
        <h3>Privacy</h3>
        <label className="settings-row">
          <span>
            <strong>Private account</strong>
            <small>Only approved followers can see your posts.</small>
          </span>
          <input type="checkbox" checked={Boolean(user.isPrivate)} disabled={saving === "isPrivate"} onChange={() => toggle("isPrivate")} />
        </label>
        <label className="settings-row">
          <span>
            <strong>Show online status</strong>
            <small>Let others see when you are active.</small>
          </span>
          <input
            type="checkbox"
            checked={user.showOnlineStatus !== false}
            disabled={saving === "showOnlineStatus"}
            onChange={() => toggle("showOnlineStatus")}
          />
        </label>
      </section>

      <section className="settings-section">
        <h3>Blocked accounts</h3>
        {loading && <p className="loading-text">Loading...</p>}
        {!loading && blocked.length === 0 && <p className="empty-text">You have not blocked anyone.</p>}
        {blocked.map((u) => (
          <UserListItem key={u._id} user={u}>
            <button className="secondary-btn" onClick={() => unblock(u._id)}>
              Unblock
            </button>
          </UserListItem>
        ))}
      </section>

      <button className="logout-btn" onClick={handleLogout}>
        <FiLogOut /> Log out
      </button>
    </div>
  );
}
