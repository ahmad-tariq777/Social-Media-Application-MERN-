const has = (list = [], id) => list.some((x) => String(x) === String(id));

export const shapeContent = (doc, me, savedField) => {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    ...obj,
    likedByMe: has(obj.likes, me._id),
    savedByMe: has(me[savedField], obj._id),
  };
};

export const shapeComment = (doc, me) => {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return { ...obj, likedByMe: has(obj.likes, me._id), likes: obj.likes };
};
