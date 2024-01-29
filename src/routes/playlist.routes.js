import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = express.Router();

router.use(verifyJWT, upload.none());

router.route("/create").post(createPlaylist);

router.route("/update/:playlistId").patch(updatePlaylist);
router.route("/get/:playlistId").get(getPlaylistById);
router.route("/delete/:playlistId").delete(deletePlaylist);

router.route("/getuserplaylist/:userId").get(getUserPlaylists);

router.route("/addtoplaylist/:videoId/:playlistId").patch(addVideoToPlaylist);
router
  .route("/removefromplaylist/:videoId/:playlistId")
  .patch(removeVideoFromPlaylist);

export default router;
