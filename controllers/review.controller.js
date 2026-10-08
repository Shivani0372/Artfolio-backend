const Review = require("../models/Review");
const Order = require("../models/Order");

// Create review
const createReview = async (req, res) => {
  try {
    const {
      artworkId,
      orderId,
      rating,
      comment,
    } = req.body;

    if (!artworkId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Artwork ID and Order ID are required",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Review comment is required",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
      orderStatus: "DELIVERED",
      "items.artwork": artworkId,
    });

    if (!order) {
      return res.status(400).json({
        success: false,
        message:
          "You can review an artwork only after receiving the order",
      });
    }

    const alreadyReviewed = await Review.findOne({
      artwork: artworkId,
      customer: req.user._id,
      order: orderId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this artwork",
      });
    }

    const review = await Review.create({
      artwork: artworkId,
      customer: req.user._id,
      order: orderId,
      rating,
      comment: comment.trim(),
    });

    await review.populate(
      "customer",
      "name avatar"
    );

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

// Get artwork reviews
const getArtworkReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      artwork: req.params.artworkId,
      isActive: true,
    })
      .populate("customer", "name avatar")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          ) / totalReviews;

    res.status(200).json({
      success: true,
      totalReviews,
      averageRating: Number(
        averageRating.toFixed(1)
      ),
      reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Update own review
const updateReview = async (req, res) => {
  try {
    const {
      rating,
      comment,
    } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }

      review.rating = rating;
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot be empty",
        });
      }

      review.comment = comment.trim();
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

// Delete own review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.isActive = false;

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getArtworkReviews,
  updateReview,
  deleteReview,
};