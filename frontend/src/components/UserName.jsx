import { MdVerified } from "react-icons/md";
import "../styles/Common.css";

export default function UserName({ user, className = "" }) {
  return (
    <span className={`user-name ${className}`.trim()}>
      {user?.username || "Unknown"}
      {user?.isVerified && <MdVerified className="verified-icon" />}
    </span>
  );
}
