import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  likeComment,
  likeTweet,
  likeVideo,
} from "../controllers/like.controller.js";

const router = express.Router();
router.use(verifyJWT); //apply to all routes.

router.route("/toggle/v/:videoId").post(likeVideo);
router.route("/toggle/c/:commentId").post(likeComment);
router.route("/toggle/t/:tweetId").post(likeTweet);
router.route("/get-all/likedvideos").get(getLikedVideos);
export default router;
