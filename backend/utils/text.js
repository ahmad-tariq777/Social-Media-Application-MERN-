export const extractHashtags = (text = "") =>
  [...new Set((text.match(/#([\p{L}\p{N}_]{1,50})/gu) || []).map((t) => t.slice(1).toLowerCase()))];

export const extractMentions = (text = "") =>
  [...new Set((text.match(/@([a-zA-Z0-9_.]{1,30})/g) || []).map((t) => t.slice(1)))];

export const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
