const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

// ==========================
// AUTH MIDDLEWARE
// ==========================

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.userId
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ==========================
// REGISTER
// ==========================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      bio,
    } = req.body;

    if (
      !name ||
      !username ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, username, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "Email or username already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      bio: bio || "",
    });

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error during registration",
    });
  }
});

// ==========================
// LOGIN
// ==========================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error during login",
    });
  }
});

// ==========================
// TEMPORARY PASSWORD RESET
// ==========================

router.put(
  "/reset-password",
  async (req, res) => {
    try {
      const {
        email,
        newPassword,
      } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Email and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters",
        });
      }

      const user = await User.findOne({
        email,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      user.password =
        hashedPassword;

      await user.save();

      res.json({
        success: true,
        message:
          "Password reset successfully",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while resetting password",
      });
    }
  }
);

// ==========================
// FOLLOW / UNFOLLOW USER
// ==========================

router.put(
  "/follow/:userId",
  protect,
  async (req, res) => {
    try {
      const targetUserId =
        req.params.userId;

      // Cannot follow yourself
      if (
        req.user._id.toString() ===
        targetUserId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot follow yourself",
        });
      }

      const targetUser =
        await User.findById(
          targetUserId
        );

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      const alreadyFollowing =
        req.user.following.some(
          (id) =>
            id.toString() ===
            targetUserId
        );

      if (alreadyFollowing) {
        // UNFOLLOW

        req.user.following =
          req.user.following.filter(
            (id) =>
              id.toString() !==
              targetUserId
          );

        targetUser.followers =
          targetUser.followers.filter(
            (id) =>
              id.toString() !==
              req.user._id.toString()
          );

        await req.user.save();
        await targetUser.save();

        return res.json({
          success: true,
          message:
            "User unfollowed successfully",
          following: false,
          followers:
            targetUser.followers.length,
        });
      }

      // FOLLOW

      req.user.following.push(
        targetUser._id
      );

      targetUser.followers.push(
        req.user._id
      );

      await req.user.save();
      await targetUser.save();

      res.json({
        success: true,
        message:
          "User followed successfully",
        following: true,
        followers:
          targetUser.followers.length,
      });
    } catch (error) {
      console.error(
        "Follow error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while following user",
      });
    }
  }
);

// ==========================
// GET ALL USERS
// ==========================

router.get(
  "/users",
  async (req, res) => {
    try {
      const users =
        await User.find()
          .select("-password")
          .sort({
            createdAt: -1,
          });

      res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error(
        "Get users error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while fetching users",
      });
    }
  }
);

// ==========================
// GET USER PROFILE
// ==========================

router.get(
  "/profile/:userId",
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.userId
        )
          .select("-password")
          .populate(
            "followers",
            "name username avatar"
          )
          .populate(
            "following",
            "name username avatar"
          );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "Profile error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while fetching profile",
      });
    }
  }
);

// ==========================
// EXPORT ROUTER
// ==========================

module.exports = router;