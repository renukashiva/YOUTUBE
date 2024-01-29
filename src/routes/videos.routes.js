import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/videos.controller.js";

const router = express.Router();
router.use(verifyJWT);

router.route("/get/all").get(getAllVideos);
router.route("/publish").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route("/get/:videoId").get(getVideoById);
router.route("/update/:videoId").patch(upload.single("thumbnail"), updateVideo);
router.route("/delete/:videoId").delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
