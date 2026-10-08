const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index(
  {
    artwork: 1,
    customer: 1,
    order: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Review", reviewSchema);