import { FiX } from "react-icons/fi";
import CommentSection from "./CommentSection";
import "../styles/CommentModal.css";

export default function CommentModal({ targetType = "reels", targetId, ownerId, disabled, onCountChange, onClose }) {
  return (
    <div className="comment-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <button className="close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>
        <h3>Comments</h3>
        <CommentSection
          targetType={targetType}
          targetId={targetId}
          ownerId={ownerId}
          disabled={disabled}
          onCountChange={onCountChange}
        />
      </div>
    </div>
  );
}
