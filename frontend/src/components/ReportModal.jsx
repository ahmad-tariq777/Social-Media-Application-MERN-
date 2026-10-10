import { useState } from "react";
import api, { errMsg } from "../api";
import Modal from "./Modal";

const REASONS = [
  ["spam", "Spam"],
  ["harassment", "Harassment or bullying"],
  ["hate", "Hate speech"],
  ["violence", "Violence"],
  ["nudity", "Nudity"],
  ["false_information", "False information"],
  ["other", "Something else"],
];

export default function ReportModal({ targetType, target, onClose }) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await api.post("/reports", { targetType, target, reason, details });
      setDone(true);
      setMessage("Thanks, your report has been submitted.");
    } catch (err) {
      setMessage(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Report ${targetType.toLowerCase()}`} onClose={onClose}>
      <form className="report-form" onSubmit={submit}>
        {REASONS.map(([value, label]) => (
          <label key={value} className="report-option">
            <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} />
            {label}
          </label>
        ))}
        <textarea
          className="report-details"
          placeholder="Add details (optional)"
          maxLength={500}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        {message && <p className={`form-message ${done ? "success" : "error"}`}>{message}</p>}
        <div className="modal-actions">
          {!done && (
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? "Sending..." : "Submit report"}
            </button>
          )}
          <button type="button" className="secondary-btn" onClick={onClose}>
            {done ? "Close" : "Cancel"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
