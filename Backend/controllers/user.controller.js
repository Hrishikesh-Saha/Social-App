import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Notification from "../models/nofication.model.js";

export const getUserProfile = async (req, res) => {
  const { userName } = req.params;

  try {
    const user = await User.findOne({ userName }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error(`Error in getUserProfile controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const userToFollow = await User.findById(id).select("-password");
    const carrentUser = await User.findById(req.user._id).select("-password");

    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You can't follow/unfollow yourself" });
    }

    if (!userToFollow || !carrentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = carrentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // Follow
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      // Send notification to the user:

      const newNotification = new Notification({
        from: req.user._id,
        to: userToFollow._id,
        type: "follow",
      });

      await newNotification.save();

      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.error(`Error in followUnfollowUser controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.error(`Error in getSuggestedUsers controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  const { newPassword, currentPassword, fullName, userName, email, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;
  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (
      (!currentPassword && newPassword) ||
      (currentPassword && !newPassword)
    ) {
      return res
        .status(400)
        .json({ error: "Please provide both current and new password" });
    }
    if (currentPassword && newPassword) {
      const isMatch = bcrypt.compareSync(currentPassword, user.password);

      if (!isMatch)
        return res.status(400).json({ error: "Invalid current password" });

      if (newPassword.length < 6)
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      //https://res.cloudiniary.com/23efsdfa/upload/image/dasdasd/dasdasdasd/dghirfkjnadsn.png

      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }

      const uploadResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadResponse.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }

      const uploadResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadResponse.secure_url;
    }
 
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const existingEmail = await User.findOne({ email });

      if (existingEmail){
        return res.status(400).json({ error: "Email is already taken" });
      }

      user.email = email;
    }

    if (userName){
      const existingUser = await User.findOne({userName})
      if (existingUser){
        return res.status(400).json({error: "Username is already taken"})
      }

      user.userName = userName;
    }

    user.fullName = fullName || user.fullName;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    user.password = null;

    res.status(200).json(user);
  } catch (error) {
    console.error(`Error in updateUser controller: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};