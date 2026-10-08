const Wishlist = require("../models/Wishlist");
const Artwork = require("../models/Artwork");

// Add artwork to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { artworkId } = req.body;

    if (!artworkId) {
      return res.status(400).json({
        success: false,
        message: "Artwork ID is required",
      });
    }

    const artwork = await Artwork.findOne({
      _id: artworkId,
      status: "APPROVED",
      isActive: true,
    });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    let wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        artworks: [artworkId],
      });
    } else {
      const alreadyExists = wishlist.artworks.some(
        (id) => id.toString() === artworkId
      );

      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: "Artwork already exists in wishlist",
        });
      }

      wishlist.artworks.push(artworkId);
      await wishlist.save();
    }

    await wishlist.populate({
      path: "artworks",
      populate: [
        {
          path: "artist",
          select: "name email avatar",
        },
        {
          path: "category",
          select: "name",
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Artwork added to wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("Add wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add artwork to wishlist",
      error: error.message,
    });
  }
};

// Get wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    }).populate({
      path: "artworks",
      populate: [
        {
          path: "artist",
          select: "name email avatar",
        },
        {
          path: "category",
          select: "name",
        },
      ],
    });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        wishlist: {
          artworks: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};

// Remove artwork from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { artworkId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    wishlist.artworks = wishlist.artworks.filter(
      (id) => id.toString() !== artworkId
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Artwork removed from wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove artwork from wishlist",
      error: error.message,
    });
  }
};

// Clear wishlist
const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user._id,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    wishlist.artworks = [];

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Wishlist cleared",
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear wishlist",
      error: error.message,
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
};