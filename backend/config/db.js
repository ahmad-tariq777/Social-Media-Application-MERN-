import mongoose from "mongoose";

const cache = (globalThis.__mongooseCache ||= { conn: null, promise: null });

const connectDB = async () => {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log("MongoDB Connected");
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

export default connectDB;
