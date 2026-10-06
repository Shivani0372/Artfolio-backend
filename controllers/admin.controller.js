const Artwork = require("../models/Artwork");

// ==========================================
// GET PENDING ARTWORKS
// ==========================================

const getPendingArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find({
      status: "PENDING",
      isActive: true,
    })
      .populate(
        "artist",
        "name email avatar isVerified"
      )
      .populate("category", "name")
      .sort({
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: artworks.length,
      data: {
        artworks,
      },
    });
  } catch (error) {
    console.error(
      "Get Pending Artworks Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get pending artworks",
      error: error.message,
    });
  }
};

// ==========================================
// APPROVE ARTWORK
// ==========================================

const approveArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(
      req.params.id
    );

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    if (artwork.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Artwork is already approved",
      });
    }

    artwork.status = "APPROVED";
    artwork.rejectionReason = "";
    artwork.isActive = true;

    await artwork.save();

    return res.status(200).json({
      success: true,
      message: "Artwork approved successfully",
      data: {
        artwork,
      },
    });
  } catch (error) {
    console.error(
      "Approve Artwork Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to approve artwork",
      error: error.message,
    });
  }
};

// ==========================================
// REJECT ARTWORK
// ==========================================

const rejectArtwork = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const artwork = await Artwork.findById(
      req.params.id
    );

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    artwork.status = "REJECTED";
    artwork.rejectionReason = reason;
    artwork.isActive = false;

    await artwork.save();

    return res.status(200).json({
      success: true,
      message: "Artwork rejected",
      data: {
        artwork,
      },
    });
  } catch (error) {
    console.error(
      "Reject Artwork Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to reject artwork",
      error: error.message,
    });
  }
};

module.exports = {
  getPendingArtworks,
  approveArtwork,
  rejectArtwork,
};