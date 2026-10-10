import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import api, { errMsg } from "../api";
import PostCard from "../components/PostCard";
import ReelCard from "../components/ReelCard";
import "../styles/Feed.css";

export default function ContentDetail({ kind }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setItem(null);
    setError("");
    api
      .get(`/${kind}s/${id}`)
      .then((res) => setItem(res.data))
      .catch((err) => setError(errMsg(err, "Content not found")));
  }, [kind, id]);

  const goBack = () => navigate(-1);

  return (
    <div className="feed content-detail">
      <button className="back-btn" onClick={goBack}>
        <FiArrowLeft /> Back
      </button>
      {error && <div className="no-posts">{error}</div>}
      {!item && !error && <div className="loading">Loading...</div>}
      {item && kind === "post" && <PostCard post={item} onDeleted={goBack} onRemoved={goBack} />}
      {item && kind === "reel" && (
        <div className="single-reel">
          <ReelCard reel={item} muted={muted} onToggleMute={() => setMuted((m) => !m)} onDeleted={goBack} />
        </div>
      )}
    </div>
  );
}
