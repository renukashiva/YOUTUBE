import express from "express";

import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = express.Router();

router.use(verifyJWT, upload.none()); //apply verifyJWT middlewares to all routes.

router.route("/:videoId").get(getVideoComments).post(addComment);

router.route("/u/d/:commentId").patch(updateComment).delete(deleteComment);

export default router;
