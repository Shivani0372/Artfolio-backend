const Artwork = require("../models/Artwork");
const User = require("../models/User");
const Order = require("../models/Order");

// ==========================================
// GET ADMIN DASHBOARD STATISTICS
// ==========================================

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalArtists,
      totalCustomers,
      totalArtworks,
      pendingArtworks,
      approvedArtworks,
      rejectedArtworks,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "ARTIST",
      }),

      User.countDocuments({
        role: "CUSTOMER",
      }),

      Artwork.countDocuments(),

      Artwork.countDocuments({
        status: "PENDING",
      }),

      Artwork.countDocuments({
        status: "APPROVED",
      }),

      Artwork.countDocuments({
        status: "REJECTED",
      }),

      Order.countDocuments(),

      Order.countDocuments({
        orderStatus: {
          $in: ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED"],
        },
      }),

      Order.countDocuments({
        orderStatus: "DELIVERED",
      }),

      Order.countDocuments({
        orderStatus: "CANCELLED",
      }),

      Order.aggregate([
        {
          $match: {
            paymentStatus: "PAID",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          artists: totalArtists,
          customers: totalCustomers,
        },

        artworks: {
          total: totalArtworks,
          pending: pendingArtworks,
          approved: approvedArtworks,
          rejected: rejectedArtworks,
        },

        orders: {
          total: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },

        revenue: {
          total: totalRevenue,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get Admin Dashboard Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get admin dashboard statistics",
      error: error.message,
    });
  }
};

// ==========================================
// GET PENDING ARTWORKS
// ==========================================

// ==========================================
// GET PENDING ARTWORKS
// ==========================================

const getPendingArtworks = async (req, res) => {
  try {
    const page = Math.max(
      parseInt(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit) || 10,
        1
      ),
      50
    );

    const skip = (page - 1) * limit;

    const search = req.query.search?.trim();

    const filter = {
      status: "PENDING",
      isActive: true,
    };

    // Search by artwork title
    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    const [artworks, total] = await Promise.all([
      Artwork.find(filter)
        .populate(
          "artist",
          "name email avatar isVerified"
        )
        .populate(
          "category",
          "name"
        )
        .sort({
          createdAt: 1,
        })
        .skip(skip)
        .limit(limit),

      Artwork.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(
      total / limit
    );

    return res.status(200).json({
      success: true,

      data: {
        artworks,

        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage:
            page < totalPages,
          hasPreviousPage:
            page > 1,
        },
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

// ==========================================
// FEATURE / UNFEATURE ARTWORK
// ==========================================

const updateArtworkFeaturedStatus = async (req, res) => {
  try {
    const { isFeatured } = req.body;

    // ==========================================
    // VALIDATE isFeatured
    // ==========================================

    if (typeof isFeatured !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isFeatured must be a boolean value",
      });
    }

    // ==========================================
    // FIND ARTWORK
    // ==========================================

    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    // ==========================================
    // ARTWORK MUST BE APPROVED
    // ==========================================

    if (artwork.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Only approved artworks can be featured",
      });
    }

    // ==========================================
    // ARTWORK MUST BE ACTIVE
    // ==========================================

    if (!artwork.isActive) {
      return res.status(400).json({
        success: false,
        message: "Inactive artwork cannot be featured",
      });
    }

    // ==========================================
    // CHECK IF STATUS IS ALREADY THE SAME
    // ==========================================

    if (artwork.isFeatured === isFeatured) {
      return res.status(400).json({
        success: false,
        message: isFeatured
          ? "Artwork is already featured"
          : "Artwork is already unfeatured",
      });
    }

    // ==========================================
    // UPDATE FEATURED STATUS
    // ==========================================

    artwork.isFeatured = isFeatured;

    await artwork.save();

    return res.status(200).json({
      success: true,
      message: isFeatured
        ? "Artwork featured successfully"
        : "Artwork unfeatured successfully",
      data: {
        artwork,
      },
    });
  } catch (error) {
    console.error(
      "Update Artwork Featured Status Error:",
      error
    );

    // ==========================================
    // INVALID MONGODB OBJECT ID
    // ==========================================

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid artwork ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update artwork featured status",
      error: error.message,
    });
  }
};

// ==========================================
// ACTIVATE / DEACTIVATE ARTWORK
// ==========================================

const updateArtworkStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    // ==========================================
    // VALIDATE isActive
    // ==========================================

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    // ==========================================
    // FIND ARTWORK
    // ==========================================

    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    // ==========================================
    // REJECTED ARTWORK CANNOT BE ACTIVATED
    // ==========================================

    if (isActive === true && artwork.status === "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Rejected artwork cannot be activated",
      });
    }

    // ==========================================
    // CHECK IF STATUS IS ALREADY THE SAME
    // ==========================================

    if (artwork.isActive === isActive) {
      return res.status(400).json({
        success: false,
        message: isActive
          ? "Artwork is already active"
          : "Artwork is already inactive",
      });
    }

    // ==========================================
    // UPDATE ACTIVE STATUS
    // ==========================================

    artwork.isActive = isActive;

    // ==========================================
    // IF DEACTIVATING, REMOVE FROM FEATURED
    // ==========================================

    if (isActive === false) {
      artwork.isFeatured = false;
    }

    await artwork.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Artwork activated successfully"
        : "Artwork deactivated successfully",
      data: {
        artwork,
      },
    });
  } catch (error) {
    console.error("Update Artwork Status Error:", error);

    // ==========================================
    // INVALID MONGODB OBJECT ID
    // ==========================================

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid artwork ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update artwork status",
      error: error.message,
    });
  }
};

// ==========================================
// GET RECENT ORDERS
// ==========================================

const getRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit) || 10,
      50
    );

    const Order = require("../models/Order");

    const orders = await Order.find()
      .populate(
        "customer",
        "name email"
      )
      .populate(
        "items.artist",
        "name email"
      )
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: {
        orders,
      },
    });
  } catch (error) {
    console.error(
      "Get Recent Orders Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get recent orders",
      error: error.message,
    });
  }
};

// ==========================================
// GET RECENT USERS
// ==========================================

const getRecentUsers = async (req, res) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit) || 10,
      50
    );

    const users = await User.find()
      .select(
        "name email role avatar isVerified isActive createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error(
      "Get Recent Users Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get recent users",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL USERS
// ==========================================

const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      50
    );

    const skip = (page - 1) * limit;

    const search = req.query.search?.trim();
    const role = req.query.role?.trim().toUpperCase();
    const isActiveQuery = req.query.isActive;

    const filter = {};

    // ==========================================
    // SEARCH BY NAME OR EMAIL
    // ==========================================

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ==========================================
    // FILTER BY ROLE
    // ==========================================

    if (role) {
      filter.role = role;
    }

    // ==========================================
    // FILTER BY ACTIVE STATUS
    // ==========================================

    if (isActiveQuery !== undefined) {
      filter.isActive = isActiveQuery === "true";
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "name email role avatar isVerified isActive createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
  }
};

// ==========================================
// GET USER BY ID
// ==========================================

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select(
        "name email role avatar isVerified isActive createdAt updatedAt"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);

    // Handle invalid MongoDB ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message,
    });
  }
};

// ==========================================
// ACTIVATE / DEACTIVATE USER
// ==========================================

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    // ==========================================
    // VALIDATE isActive
    // ==========================================

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // PREVENT ADMIN FROM DEACTIVATING THEMSELVES
    // ==========================================

    if (
      user._id.toString() === req.user._id.toString() &&
      isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own admin account",
      });
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    // ==========================================
    // INVALID MONGODB OBJECT ID
    // ==========================================

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

// ==========================================
// CHANGE USER ROLE
// ==========================================

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // ==========================================
    // VALIDATE ROLE
    // ==========================================

    const allowedRoles = ["CUSTOMER", "ARTIST"];

    if (!role || !allowedRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Role must be either CUSTOMER or ARTIST",
      });
    }

    const newRole = role.toUpperCase();

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // PREVENT ADMIN ROLE CHANGE
    // ==========================================

    if (user.role === "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "Admin role cannot be changed using this API",
      });
    }

    // ==========================================
    // CHECK IF ROLE IS ALREADY THE SAME
    // ==========================================

    if (user.role === newRole) {
      return res.status(400).json({
        success: false,
        message: `User already has the ${newRole} role`,
      });
    }

    // ==========================================
    // UPDATE ROLE
    // ==========================================

    user.role = newRole;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role changed to ${newRole} successfully`,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Update User Role Error:", error);

    // ==========================================
    // INVALID MONGODB OBJECT ID
    // ==========================================

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders,
  getRecentUsers,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getPendingArtworks,
  approveArtwork,
  rejectArtwork,
  updateArtworkFeaturedStatus,
  updateArtworkStatus,
};