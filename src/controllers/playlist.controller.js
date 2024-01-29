import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/vedio.model.js";

export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "name and description is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "failed to create playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playlistId } = req.params;

  if (!name || !description) {
    throw new ApiError(400, "name and description is required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (playlist?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can update the playlist ");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatePlaylist, "playlist updated successfully")
    );
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (playlist?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can update the playlist ");
  }

  await Playlist.findByIdAndDelete(playlist?._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlistId or videoId");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (playlist.owner?.toString() && video.owner?.toString() !== req.user?._id) {
    throw new ApiError(400, "only owner can add video to their playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "failed to add video to playlist,please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "successfully video added to playlist"
      )
    );
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlistId or videoId");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (playlist.owner?.toString() && video.owner?.toString() !== req.user?._id) {
    throw new ApiError(400, "only owner can remove video from their playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId, // discussion needed....
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "successfully video removed from playlist"
      )
    );
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  const playlistVideos = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $match: {
        "videos.isPublished": true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalViews: 1,
        totalVideos: 1,
        videos: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
        owner: {
          username: 1,
          fullname: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistVideos, "playlist fetched successfully")
    );
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "invalid userId");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalViews: 1,
        totalVideos: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "user playlists fetched successfully")
    );
});
