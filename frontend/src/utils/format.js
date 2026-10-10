export const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
};

export const formatTime = (date) =>
  date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export const compact = (n = 0) => new Intl.NumberFormat("en", { notation: "compact" }).format(n || 0);

export const idOf = (value) => (value && typeof value === "object" ? value._id : value);

export const sameId = (a, b) => Boolean(a) && Boolean(b) && String(idOf(a)) === String(idOf(b));

export const displayName = (user) => user?.name || user?.username || "Unknown";

export const lastSeenText = (date) => {
  if (!date) return "";
  return `Last seen ${timeAgo(date)}`;
};

export const getMedia = (post) => {
  if (post?.media?.length) return post.media;
  if (post?.videoUrl) return [{ url: post.videoUrl, type: "video" }];
  if (post?.imageUrl) return [{ url: post.imageUrl, type: "image" }];
  return [];
};
