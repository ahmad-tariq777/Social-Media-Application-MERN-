import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { globalSearch } from "../controllers/searchController.js";

const router = express.Router();

router.get("/", auth, globalSearch);

export default router;
