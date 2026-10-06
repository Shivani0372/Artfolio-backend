const mongoose = require("mongoose");

const artworkSchema = new mongoose.Schema(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Artwork title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Artwork description is required"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    medium: {
      type: String,
      required: [true, "Medium is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          default: "",
        },
      },
    ],

    dimensions: {
      width: {
        type: Number,
        min: 0,
      },

      height: {
        type: Number,
        min: 0,
      },

      unit: {
        type: String,
        enum: ["cm", "inch"],
        default: "inch",
      },
    },

    yearCreated: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear(),
    },

    stock: {
      type: Number,
      default: 1,
      min: 0,
    },

    availability: {
      type: String,
      enum: [
        "AVAILABLE",
        "SOLD",
        "RESERVED",
        "COMING_SOON",
      ],
      default: "AVAILABLE",
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
      ],
      default: "PENDING",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    views: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
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

artworkSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  medium: "text",
});

artworkSchema.index({
  price: 1,
  category: 1,
  status: 1,
});

module.exports = mongoose.model(
  "Artwork",
  artworkSchema
);