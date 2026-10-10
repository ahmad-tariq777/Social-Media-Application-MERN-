import { Fragment } from "react";
import { Link } from "react-router-dom";
import "../styles/Common.css";

export default function RichText({ text = "", mentions = [] }) {
  const byName = new Map(
    mentions.filter((m) => m && typeof m === "object").map((m) => [m.username, m._id])
  );
  const parts = text.split(/([#@][\p{L}\p{N}_.]+)/gu);

  return (
    <>
      {parts.map((part, index) => {
        if (/^#[\p{L}\p{N}_]+$/u.test(part)) {
          return (
            <Link key={index} className="hashtag" to={`/hashtag/${part.slice(1).toLowerCase()}`}>
              {part}
            </Link>
          );
        }
        if (part.startsWith("@")) {
          const id = byName.get(part.slice(1));
          if (id) {
            return (
              <Link key={index} className="mention" to={`/profile/${id}`}>
                {part}
              </Link>
            );
          }
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
