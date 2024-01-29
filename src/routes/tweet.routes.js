import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = express.Router();

router.use(verifyJWT, upload.none());

router.route("/create").post(createTweet);
router.route("/update/:tweetId").patch(updateTweet);
router.route("/delete/:tweetId").delete(deleteTweet);
router.route("/getusertweets/:userId").get(getUserTweets);

export default router;
