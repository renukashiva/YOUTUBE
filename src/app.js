import express from "express";
//const express = require("express");
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

//routes import
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import SubscriptionRoutes from "./routes/subscription.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import videosRoutes from "./routes/videos.routes.js";
import morgan from "morgan";

//routes declartion
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", SubscriptionRoutes);
app.use("/api/v1/playlists", playlistRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/videos", videosRoutes);

export default app;
