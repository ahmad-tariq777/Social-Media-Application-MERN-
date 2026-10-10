export const notFound = (req, res) => res.status(404).json({ msg: `Route not found: ${req.method} ${req.originalUrl}` });

export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let msg = err.message || "Server error";

  if (err.name === "CastError") {
    status = 400;
    msg = "Invalid id";
  } else if (err.name === "ValidationError") {
    status = 400;
    msg = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.code === 11000) {
    status = 409;
    msg = `${Object.keys(err.keyPattern || {})[0] || "Value"} already exists`;
  } else if (err.name === "MulterError") {
    status = 400;
    msg = err.message;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ msg, message: msg });
};
