import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  subscriptionToggle,
} from "../controllers/subscription.controller.js";

const router = express.Router();
router.use(verifyJWT);

router.route("/subscription/:channelId").post(subscriptionToggle);
router.route("/getsubscribedchannel/:subscriberId").get(getSubscribedChannels);
router
  .route("/getuserchannelsubscribers/:channelId")
  .get(getUserChannelSubscribers);

export default router;
