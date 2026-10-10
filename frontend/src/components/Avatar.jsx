import { FiUser, FiUsers } from "react-icons/fi";
import "../styles/Common.css";

export default function Avatar({ src, alt = "", size = "md", group = false, className = "" }) {
  const classes = `avatar avatar-${size} ${className}`.trim();
  if (!src) {
    return (
      <span className={`${classes} avatar-fallback`}>
        {group ? <FiUsers /> : <FiUser />}
      </span>
    );
  }
  return <img src={src} alt={alt} className={classes} loading="lazy" />;
}
