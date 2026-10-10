import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { createReport, getMyReports } from "../controllers/reportController.js";

const router = express.Router();

router.use(auth);

router.post("/", createReport);
router.get("/mine", getMyReports);

export default router;
