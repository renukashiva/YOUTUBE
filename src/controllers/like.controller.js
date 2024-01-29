import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";

export const likeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid videoId");
  }

  const likedAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res
      .status(200)
      .json(new ApiResponse(200, "unliked the video successfully"));
  }

  const like = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, like, "liked video successfully"));
});

export const likeComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "invalid commentId");
  }

  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res
      .status(200)
      .json(new ApiResponse(200, "unliked comment successfully"));
  }

  const comment = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment liked successfully"));
});

export const likeTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid tweetId");
  }

  const likedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);

    return res
      .status(200)
      .json(new ApiResponse(200, "unliked tweet successfully"));
  }

  const tweet = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet liked successfully"));
});

export const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideosAggregate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideo: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullname: 1,
            "avatar.url": 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideosAggregate,
        "liked videos fetched successfully"
      )
    );
});
