import mongoose from "mongoose";

export default (...params) =>
  (req, res, next) => {
    for (const p of params) {
      if (req.params[p] && !mongoose.isValidObjectId(req.params[p])) {
        return res.status(400).json({ msg: `Invalid ${p}` });
      }
    }
    next();
  };
