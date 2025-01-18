import { v2 as cloudinary } from "cloudinary";

import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/nofication.model.js";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { image } = req.body;
    let userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!text && !image) {
      return res.status(400).json({ error: "Text or image is required" });
    }

    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image);
      image = uploadRes.secure_url;
    }

    const newPost = new Post({
      text,
      image,
      user: userId,
    });

    await newPost.save();

    res.status(201).json({ message: "Post created successfully" });
  } catch (error) {
    console.error(`Error in createPost controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this post" });
    }

    if (post.image) {
      const imgId = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(`Error in deletePost controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!text) return res.status(400).json({ error: "Text is required" });

    const comment = {
      text,
      user: userId,
    };

    post.comments.push(comment);
    await post.save();

    const updatedComments = await Post.findById(postId).populate({
      path : "comments.user",
      select : "-password"
    })

    res.status(200).json(updatedComments.comments);
  } catch (error) {
    console.error(`Error in commentOnPost controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ error: "Post not found" });

    const liked = post.likes.includes(userId);

    if (liked) {
      // Unlike the post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );

      res.status(200).json(updatedLikes);
    } else {
      // Like the post
      post.likes.push(userId);

      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

      const updatedLikes = post.likes;

      await post.save();
      const newNotification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });

      await newNotification.save();

      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.error(`Error in likePost controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (!posts) return res.status(200).json([]);

    res.status(200).json(posts);
  } catch (error) {
    console.error(`Error in getAllPost controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(likedPosts);
  } catch (error) {
    console.error(`Error in getLikedPosts controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const following = user.following;

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(feedPosts);
  } catch (error) {
    console.error(`Error in getFollowingPosts controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userName = req.params.username;
    const user = await User.findOne({ userName });

    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(posts);
  } catch (error) {
    console.error(`Error in getUserPosts controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};
