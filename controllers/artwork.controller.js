const Artwork = require("../models/Artwork");
const Category = require("../models/Category");
const ArtistProfile = require("../models/ArtistProfile");

// ==========================================
// CREATE ARTWORK
// ==========================================

const createArtwork = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      medium,
      price,
      images,
      dimensions,
      yearCreated,
      stock,
      tags,
    } = req.body;

    // Verify artist profile exists
    const artistProfile = await ArtistProfile.findOne({
      user: req.user._id,
    });

    if (!artistProfile) {
      return res.status(400).json({
        success: false,
        message:
          "Please create your artist profile before adding artwork",
      });
    }

    // Validate category
    const categoryExists = await Category.findOne({
      _id: category,
      isActive: true,
    });

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive category",
      });
    }

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !medium ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, category, medium and price are required",
      });
    }

    // Create artwork
    const artwork = await Artwork.create({
      artist: req.user._id,
      title,
      description,
      category,
      medium,
      price,
      images: images || [],
      dimensions,
      yearCreated,
      stock: stock ?? 1,
      tags: tags || [],
      status: "PENDING",
    });

    const populatedArtwork = await Artwork.findById(
      artwork._id
    )
      .populate("artist", "name avatar isVerified")
      .populate("category", "name");

    return res.status(201).json({
      success: true,
      message:
        "Artwork submitted successfully and is awaiting admin approval",
      data: {
        artwork: populatedArtwork,
      },
    });
  } catch (error) {
    console.error("Create Artwork Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create artwork",
      error: error.message,
    });
  }
};

// ==========================================
// GET PUBLIC ARTWORKS
// ==========================================

const getArtworks = async (req, res) => {
  try {
    const {
      search,
      category,
      medium,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      status: "APPROVED",
      isActive: true,
    };

    // Search
    if (search) {
      filter.$text = {
        $search: search,
      };
    }

    // Category
    if (category) {
      filter.category = category;
    }

    // Medium
    if (medium) {
      filter.medium = {
        $regex: medium,
        $options: "i",
      };
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Pagination
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      50
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    // Sorting
    let sortOption = {
      createdAt: -1,
    };

    if (sort === "price_asc") {
      sortOption = {
        price: 1,
      };
    }

    if (sort === "price_desc") {
      sortOption = {
        price: -1,
      };
    }

    if (sort === "popular") {
      sortOption = {
        views: -1,
        likes: -1,
      };
    }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    const artworks = await Artwork.find(filter)
      .populate(
        "artist",
        "name avatar isVerified"
      )
      .populate("category", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const total = await Artwork.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: artworks.length,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
      data: {
        artworks,
      },
    });
  } catch (error) {
    console.error("Get Artworks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get artworks",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE ARTWORK
// ==========================================

const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findOne({
      _id: req.params.id,
      status: "APPROVED",
      isActive: true,
    })
      .populate(
        "artist",
        "name avatar isVerified"
      )
      .populate("category", "name");

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    // Increase view count
    artwork.views += 1;
    await artwork.save();

    return res.status(200).json({
      success: true,
      data: {
        artwork,
      },
    });
  } catch (error) {
    console.error("Get Artwork Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get artwork",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY ARTWORKS
// ==========================================

const getMyArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find({
      artist: req.user._id,
    })
      .populate("category", "name")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: artworks.length,
      data: {
        artworks,
      },
    });
  } catch (error) {
    console.error("Get My Artworks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get your artworks",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE MY ARTWORK
// ==========================================

const updateArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findOne({
      _id: req.params.id,
      artist: req.user._id,
    });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message:
          "Artwork not found or you do not own this artwork",
      });
    }

    // Don't allow editing approved artwork without
    // sending it back through moderation.
    const allowedFields = [
      "title",
      "description",
      "category",
      "medium",
      "price",
      "images",
      "dimensions",
      "yearCreated",
      "stock",
      "tags",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        artwork[field] = req.body[field];
      }
    });

    // If artwork was previously approved,
    // changes require another review.
    if (artwork.status === "APPROVED") {
      artwork.status = "PENDING";
      artwork.rejectionReason = "";
    }

    await artwork.save();

    const updatedArtwork = await Artwork.findById(
      artwork._id
    )
      .populate(
        "artist",
        "name avatar isVerified"
      )
      .populate("category", "name");

    return res.status(200).json({
      success: true,
      message:
        "Artwork updated and submitted for review",
      data: {
        artwork: updatedArtwork,
      },
    });
  } catch (error) {
    console.error("Update Artwork Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update artwork",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE MY ARTWORK
// ==========================================

const deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findOne({
      _id: req.params.id,
      artist: req.user._id,
    });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message:
          "Artwork not found or you do not own this artwork",
      });
    }

    artwork.isActive = false;

    await artwork.save();

    return res.status(200).json({
      success: true,
      message: "Artwork removed successfully",
    });
  } catch (error) {
    console.error("Delete Artwork Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove artwork",
      error: error.message,
    });
  }
};

module.exports = {
  createArtwork,
  getArtworks,
  getArtworkById,
  getMyArtworks,
  updateArtwork,
  deleteArtwork,
};