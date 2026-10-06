const ArtistProfile = require("../models/ArtistProfile");
const User = require("../models/User");

// ==========================================
// CREATE ARTIST PROFILE
// ==========================================

const createArtistProfile = async (req, res) => {
  try {
    const {
      displayName,
      bio,
      location,
      specialization,
      website,
      socialLinks,
      experience,
    } = req.body;

    // Check user role
    if (req.user.role !== "ARTIST") {
      return res.status(403).json({
        success: false,
        message: "Only artists can create an artist profile",
      });
    }

    // Check existing profile
    const existingProfile = await ArtistProfile.findOne({
      user: req.user._id,
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Artist profile already exists",
      });
    }

    if (!displayName) {
      return res.status(400).json({
        success: false,
        message: "Display name is required",
      });
    }

    const profile = await ArtistProfile.create({
      user: req.user._id,
      displayName,
      bio,
      location,
      specialization,
      website,
      socialLinks,
      experience,
    });

    return res.status(201).json({
      success: true,
      message: "Artist profile created successfully",
      data: {
        profile,
      },
    });
  } catch (error) {
    console.error("Create Artist Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create artist profile",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY ARTIST PROFILE
// ==========================================

const getMyArtistProfile = async (req, res) => {
  try {
    const profile = await ArtistProfile.findOne({
      user: req.user._id,
    }).populate("user", "name email role avatar");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    console.error("Get Artist Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get artist profile",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE MY ARTIST PROFILE
// ==========================================

const updateArtistProfile = async (req, res) => {
  try {
    const profile = await ArtistProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found",
      });
    }

    const allowedFields = [
      "displayName",
      "bio",
      "profileImage",
      "coverImage",
      "location",
      "specialization",
      "website",
      "socialLinks",
      "experience",
      "exhibitions",
      "awards",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Artist profile updated successfully",
      data: {
        profile,
      },
    });
  } catch (error) {
    console.error("Update Artist Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update artist profile",
      error: error.message,
    });
  }
};

// ==========================================
// GET PUBLIC ARTIST PROFILE
// ==========================================

const getArtistProfile = async (req, res) => {
  try {
    const profile = await ArtistProfile.findOne({
      user: req.params.id,
    }).populate(
      "user",
      "name avatar role isVerified"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    console.error("Get Public Artist Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get artist profile",
      error: error.message,
    });
  }
};

module.exports = {
  createArtistProfile,
  getMyArtistProfile,
  updateArtistProfile,
  getArtistProfile,
};