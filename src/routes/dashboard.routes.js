import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";

const router = express.Router();
router.use(verifyJWT);

router.route("/channel/stats").get(getChannelStats);
router.route("/channel/videos").get(getChannelVideos);

export default router;
