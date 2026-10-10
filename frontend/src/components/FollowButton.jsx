import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import "../styles/profile.css";

const initialState = (following, requested) => (following ? "following" : requested ? "requested" : "none");

export default function FollowButton({ userId, initialFollowing = false, initialRequested = false, followBack = false, onChange }) {
  const { refreshUser } = useAuth();
  const [state, setState] = useState(initialState(initialFollowing, initialRequested));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(initialState(initialFollowing, initialRequested));
  }, [initialFollowing, initialRequested]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let next;
      if (state === "none") {
        const res = await api.put(`/users/follow/${userId}`);
        next = res.data.requested ? "requested" : "following";
      } else {
        await api.put(`/users/unfollow/${userId}`);
        next = "none";
      }
      setState(next);
      if (onChange) onChange(next);
      refreshUser();
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const label = state === "following" ? "Following" : state === "requested" ? "Requested" : followBack ? "Follow back" : "Follow";

  return (
    <button className={`follow-btn follow-btn-${state}`} onClick={toggle} disabled={busy}>
      {label}
    </button>
  );
}
