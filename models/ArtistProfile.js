const mongoose = require("mongoose");

const artistProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      maxlength: [100, "Display name cannot exceed 100 characters"],
    },

    bio: {
      type: String,
      default: "",
      maxlength: [2000, "Bio cannot exceed 2000 characters"],
    },

    profileImage: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    specialization: [
      {
        type: String,
        trim: true,
      },
    ],

    website: {
      type: String,
      default: "",
      trim: true,
    },

    socialLinks: {
      instagram: {
        type: String,
        default: "",
      },

      facebook: {
        type: String,
        default: "",
      },

      twitter: {
        type: String,
        default: "",
      },
    },

    experience: {
      type: Number,
      default: 0,
      min: 0,
    },

    exhibitions: [
      {
        title: {
          type: String,
          required: true,
        },

        year: {
          type: Number,
        },

        location: {
          type: String,
        },
      },
    ],

    awards: [
      {
        title: {
          type: String,
          required: true,
        },

        year: {
          type: Number,
        },

        organization: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ArtistProfile",
  artistProfileSchema
);