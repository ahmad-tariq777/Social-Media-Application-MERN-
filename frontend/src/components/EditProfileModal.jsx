import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import api, { errMsg } from "../api";
import { getCroppedFile } from "../utils/cropImage";
import "../styles/profile.css";
import "../styles/EditProfileModal.css";

export default function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    bio: user.bio || "",
    website: user.website || "",
    location: user.location || "",
    isPrivate: Boolean(user.isPrivate),
    showOnlineStatus: user.showOnlineStatus !== false,
  });
  const [images, setImages] = useState({
    profilePic: { file: null, preview: user.profilePic || "" },
    coverPic: { file: null, preview: user.coverPic || "" },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cropData, setCropData] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const blobUrls = useRef([]);

  useEffect(
    () => () => {
      blobUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const pickImage = (e, field) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const src = URL.createObjectURL(file);
    blobUrls.current.push(src);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropData({ field, src });
  };

  const onCropComplete = useCallback((_, pixels) => setAreaPixels(pixels), []);

  const applyCrop = async () => {
    try {
      const file = await getCroppedFile(cropData.src, areaPixels, cropData.field);
      const preview = URL.createObjectURL(file);
      blobUrls.current.push(preview);
      setImages((prev) => ({ ...prev, [cropData.field]: { file, preview } }));
      setCropData(null);
    } catch (err) {
      setError("Could not crop the image");
    }
  };

  const removeImage = async (field) => {
    const current = images[field];
    if (current.file) {
      setImages((prev) => ({ ...prev, [field]: { file: null, preview: user[field] || "" } }));
      return;
    }
    if (!current.preview || !window.confirm("Remove this image?")) return;
    try {
      await api.delete(`/users/image/${field === "coverPic" ? "cover" : "profile"}`);
      setImages((prev) => ({ ...prev, [field]: { file: null, preview: "" } }));
      onSaved({ [field]: "" }, false);
    } catch (err) {
      setError(errMsg(err, "Failed to remove image"));
    }
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      setError("Username is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, typeof value === "boolean" ? String(value) : value));
      if (images.profilePic.file) data.append("profilePic", images.profilePic.file);
      if (images.coverPic.file) data.append("coverPic", images.coverPic.file);
      const res = await api.put(`/users/${user._id}`, data);
      onSaved(res.data, true);
    } catch (err) {
      setError(errMsg(err, "Profile update failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal edit-profile-modal">
        {saving && (
          <div className="uploading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        <h3>Edit Profile</h3>

        <div className="upload-section">
          <label>Cover photo</label>
          <div className="upload-input">
            <div className="image-picker cover">
              {images.coverPic.preview && <img src={images.coverPic.preview} alt="cover" className="preview-img cover" />}
              <label className="pick-btn">
                <FiCamera /> Change
                <input type="file" accept="image/*" hidden onChange={(e) => pickImage(e, "coverPic")} />
              </label>
              {images.coverPic.preview && (
                <button type="button" className="delete-btn" onClick={() => removeImage("coverPic")}>
                  <FiTrash2 />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="upload-section">
          <label>Profile picture</label>
          <div className="upload-input">
            <div className="image-picker">
              {images.profilePic.preview && <img src={images.profilePic.preview} alt="profile" className="preview-img" />}
              <label className="pick-btn">
                <FiCamera /> Change
                <input type="file" accept="image/*" hidden onChange={(e) => pickImage(e, "profilePic")} />
              </label>
              {images.profilePic.preview && (
                <button type="button" className="delete-btn" onClick={() => removeImage("profilePic")}>
                  <FiTrash2 />
                </button>
              )}
            </div>
          </div>
        </div>

        <label>Name</label>
        <input name="name" value={form.name} maxLength={60} onChange={setField} placeholder="Your name" />

        <label>Username</label>
        <input name="username" value={form.username} onChange={setField} placeholder="username" />

        <label>Bio</label>
        <textarea name="bio" value={form.bio} maxLength={150} onChange={setField} placeholder="Update your bio..." />

        <label>Website</label>
        <input name="website" value={form.website} maxLength={200} onChange={setField} placeholder="https://" />

        <label>Location</label>
        <input name="location" value={form.location} maxLength={80} onChange={setField} placeholder="City, Country" />

        <label className="check-row">
          <input type="checkbox" name="isPrivate" checked={form.isPrivate} onChange={setField} />
          Private account
        </label>
        <label className="check-row">
          <input type="checkbox" name="showOnlineStatus" checked={form.showOnlineStatus} onChange={setField} />
          Show online status
        </label>

        {error && <p className="form-message error">{error}</p>}

        <div className="modal-actions">
          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>

      {cropData && (
        <div className="crop-modal">
          <div className="crop-container">
            <Cropper
              image={cropData.src}
              crop={crop}
              zoom={zoom}
              aspect={cropData.field === "coverPic" ? 3 / 1 : 1}
              cropShape={cropData.field === "profilePic" ? "round" : "rect"}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="controls">
            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            <div className="crop-buttons">
              <button onClick={applyCrop}>Done</button>
              <button onClick={() => setCropData(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
