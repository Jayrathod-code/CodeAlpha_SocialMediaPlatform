const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");

const router = express.Router();

// ==========================================
// AUTH MIDDLEWARE
// ==========================================

const protect = (req, res, next) => {
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

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ==========================================
// CREATE POST
// POST /api/posts
// ==========================================

router.post("/", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Post text is required",
      });
    }

    const post = await Post.create({
      user: req.userId,
      text: text.trim(),
    });

    const populatedPost = await Post.findById(
      post._id
    )
      .populate(
        "user",
        "name username avatar"
      )
      .populate(
        "comments.user",
        "name username avatar"
      );

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.error(
      "Create post error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create post",
    });
  }
});

// ==========================================
// GET ALL POSTS
// GET /api/posts
// ==========================================

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate(
        "user",
        "name username avatar"
      )
      .populate(
        "comments.user",
        "name username avatar"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error(
      "Get posts error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
    });
  }
});

// ==========================================
// EDIT POST
// PUT /api/posts/:id
// ==========================================

router.put("/:id", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Post text is required",
      });
    }

    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only post owner can edit
    if (
      post.user.toString() !==
      req.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own post",
      });
    }

    post.text = text.trim();

    await post.save();

    const updatedPost =
      await Post.findById(post._id)
        .populate(
          "user",
          "name username avatar"
        )
        .populate(
          "comments.user",
          "name username avatar"
        );

    res.json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error(
      "Edit post error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update post",
    });
  }
});

// ==========================================
// DELETE POST
// DELETE /api/posts/:id
// ==========================================

router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.id
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Only post owner can delete
      if (
        post.user.toString() !==
        req.userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete your own post",
        });
      }

      await Post.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message: "Post deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete post error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to delete post",
      });
    }
  }
);

// ==========================================
// LIKE / UNLIKE POST
// PUT /api/posts/:id/like
// ==========================================

router.put(
  "/:id/like",
  protect,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.id
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const alreadyLiked =
        post.likes.some(
          (userId) =>
            userId.toString() ===
            req.userId.toString()
        );

      if (alreadyLiked) {
        post.likes =
          post.likes.filter(
            (userId) =>
              userId.toString() !==
              req.userId.toString()
          );
      } else {
        post.likes.push(
          req.userId
        );
      }

      await post.save();

      res.json({
        success: true,
        liked: !alreadyLiked,
        likes: post.likes,
      });
    } catch (error) {
      console.error(
        "Like error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to like/unlike post",
      });
    }
  }
);

// ==========================================
// ADD COMMENT
// POST /api/posts/:id/comments
// ==========================================

router.post(
  "/:id/comments",
  protect,
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Comment text is required",
        });
      }

      const post = await Post.findById(
        req.params.id
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      post.comments.push({
        user: req.userId,
        text: text.trim(),
      });

      await post.save();

      const updatedPost =
        await Post.findById(post._id)
          .populate(
            "user",
            "name username avatar"
          )
          .populate(
            "comments.user",
            "name username avatar"
          );

      res.json({
        success: true,
        message:
          "Comment added successfully",
        post: updatedPost,
      });
    } catch (error) {
      console.error(
        "Add comment error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to add comment",
      });
    }
  }
);

// ==========================================
// DELETE COMMENT
// DELETE /api/posts/:postId/comments/:commentId
// ==========================================

router.delete(
  "/:postId/comments/:commentId",
  protect,
  async (req, res) => {
    try {
      const {
        postId,
        commentId,
      } = req.params;

      const post =
        await Post.findById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const comment =
        post.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Only comment owner can delete
      if (
        comment.user.toString() !==
        req.userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete your own comment",
        });
      }

      comment.deleteOne();

      await post.save();

      const updatedPost =
        await Post.findById(post._id)
          .populate(
            "user",
            "name username avatar"
          )
          .populate(
            "comments.user",
            "name username avatar"
          );

      res.json({
        success: true,
        message:
          "Comment deleted successfully",
        post: updatedPost,
      });
    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete comment",
      });
    }
  }
);

module.exports = router;