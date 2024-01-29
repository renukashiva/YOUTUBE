import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import { Video } from "../models/vedio.model.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import User from "../models/user.model.js";

// get all videos based on query,sort,pagination
export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [];

  //here the name of search index is 'searach-videos'.
  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"], //serach only on title and description
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(401, "invalid userId");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  //fetch videos only that are set isPublished as true.
  pipeline.push({ $match: { isPublished: true } });

  //sortBy can be views, createdAt,duration.
  //sortType can be ascending(-1) or descending(1).
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );
  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "vidoes fetched successfully"));
});

export const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are must");
  }

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "videoFileLoalPath is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnailLocalpath is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "video file not found");
  }

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail  not found");
  }

  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
    owner: req.user?._id,
    isPublished: true,
  });

  const videoUploaded = await Video.findById(video._id);

  if (!videoUploaded) {
    throw new ApiError(500, "video uploaded failed,please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video uploaded successfully"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(vedioId)) {
    throw new ApiError(400, "invalid videoId");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(500, "failed to fetch video");
  }
  //increment the views if video fetched successfull
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });
  //add this video to user watch history
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video details fetched successfully"));
});

export const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid videoId");
  }
  if (!(title && description)) {
    throw new ApiError(400, "title and description is must");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "you cant edit this video as you are not owner");
  }

  //deleting old thumbnail and updating it
  const thumbnailToDelete = video.thumbnail.public_id;

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(400, "thumbnail not found");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: {
          public_id: thumbnail.public_id,
          url: thumbnail.url,
        },
      },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "failed to upload video,please try again");
  }

  if (updatedVideo) {
    await deleteOnCloudinary(thumbnailToDelete);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "no video found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "you cant delete this video as you are not the owner"
    );
  }

  const videoDeleted = await Video.findByIdAndDelete(video?._id);

  if (!videoDeleted) {
    throw new ApiError(400, "failed to delete the video , please try again");
  }

  await deleteOnCloudinary(video.thumbnail.public_id);
  await deleteOnCloudinary(video.videoFile.public_id, "video"); //specify video while deleting video

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "no video found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "you cant toggle publish status  as you are not the owner"
    );
  }

  const toggledVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    {
      new: true,
    }
  );

  if (!toggledVideoPublish) {
    throw new ApiError(500, "failed to toggle video publish status");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: toggledVideoPublish.isPublished },
        "toggeled video published with status"
      )
    );
});
