import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api";
import "../styles/Login.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || "/feed", { replace: true });
    } catch (err) {
      setMsg(errMsg(err, "Login failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
      {msg && <p className="login-msg error">{msg}</p>}
      <p className="login-footer">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}
