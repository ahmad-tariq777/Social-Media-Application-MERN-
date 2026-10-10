import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import UserName from "./UserName";
import "../styles/Common.css";

export default function UserListItem({ user, subtitle, children, onNavigate }) {
  return (
    <div className="user-item">
      <Link to={`/profile/${user._id}`} className="user-item-link" onClick={onNavigate}>
        <Avatar src={user.profilePic} alt={user.username} size="md" />
        <div className="user-item-text">
          <UserName user={user} />
          {(subtitle || user.name) && <span className="user-item-sub">{subtitle || user.name}</span>}
        </div>
      </Link>
      {children && <div className="user-item-actions">{children}</div>}
    </div>
  );
}
