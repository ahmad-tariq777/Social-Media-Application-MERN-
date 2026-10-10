import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import api, { errMsg } from "../api";
import "../styles/Register.css";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setSuccess(false);
      setMsg("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      await api.post("/auth/register", { ...form, username: form.username.trim() });
      setSuccess(true);
      setMsg("Account created successfully!");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setSuccess(false);
      setMsg(errMsg(err, "Registration failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <label className="input-with-icon">
          <FiUser className="input-icon" />
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </label>
        <label className="input-with-icon">
          <FiMail className="input-icon" />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label className="input-with-icon">
          <FiLock className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="button" className="input-toggle" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Register"}
        </button>
      </form>
      {msg && <p className={`register-msg ${success ? "success" : "error"}`}>{msg}</p>}
      <p className="register-footer">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
