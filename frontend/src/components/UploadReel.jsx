import { useEffect, useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import api, { errMsg } from "../api";
import "../styles/UploadReel.css";

const MAX_SIZE_MB = 100;

export default function UploadReel({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith("video/")) {
      setError("Please choose a video file");
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Video must be smaller than ${MAX_SIZE_MB}MB`);
      return;
    }
    setError("");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a video first");
      return;
    }
    const form = new FormData();
    form.append("video", file);
    form.append("caption", caption);
    form.append("commentsDisabled", String(commentsDisabled));

    setUploading(true);
    setError("");
    try {
      const res = await api.post("/reels", form, {
        onUploadProgress: (p) => setProgress(p.total ? Math.round((p.loaded * 100) / p.total) : 0),
      });
      setFile(null);
      setPreview("");
      setCaption("");
      setCommentsDisabled(false);
      setProgress(0);
      if (onUploaded) onUploaded(res.data);
    } catch (err) {
      setError(errMsg(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="upload-reel" onSubmit={submit}>
      <label className="upload-drop">
        <FiUploadCloud />
        <span>{file ? file.name : "Choose a video"}</span>
        <input type="file" accept="video/*" onChange={handleFile} hidden />
      </label>
      {preview && <video src={preview} className="upload-preview" controls muted />}
      <textarea
        placeholder="Write a caption... #tags and @mentions work too"
        value={caption}
        maxLength={2200}
        onChange={(e) => setCaption(e.target.value)}
      />
      <label className="toggle-comments">
        <input type="checkbox" checked={commentsDisabled} onChange={(e) => setCommentsDisabled(e.target.checked)} />
        Turn off comments
      </label>
      {error && <p className="form-message error">{error}</p>}
      {uploading ? (
        <div className="progress">Uploading... {progress}%</div>
      ) : (
        <button type="submit" className="primary-btn">
          Upload Reel
        </button>
      )}
    </form>
  );
}
