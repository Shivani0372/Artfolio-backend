const express = require("express");

const {
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
} = require("../controllers/admin.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// ==========================================
// ADMIN DASHBOARD
// ==========================================

router.get(
  "/dashboard",
  protect,
  authorize("ADMIN"),
  getDashboardStats
);

// ==========================================
// RECENT ORDERS
// ==========================================

router.get(
  "/orders/recent",
  protect,
  authorize("ADMIN"),
  getRecentOrders
);

// ==========================================
// RECENT USERS
// ==========================================

router.get(
  "/users/recent",
  protect,
  authorize("ADMIN"),
  getRecentUsers
);

// ==========================================
// ALL USERS
// ==========================================

router.get(
  "/users",
  protect,
  authorize("ADMIN"),
  getAllUsers
);

// ==========================================
// GET USER BY ID
// ==========================================

router.get(
  "/users/:id",
  protect,
  authorize("ADMIN"),
  getUserById
);

// ==========================================
// ACTIVATE / DEACTIVATE USER
// ==========================================

router.put(
  "/users/:id/status",
  protect,
  authorize("ADMIN"),
  updateUserStatus
);

// ==========================================
// CHANGE USER ROLE
// ==========================================

router.put(
  "/users/:id/role",
  protect,
  authorize("ADMIN"),
  updateUserRole
);

// ==========================================
// ARTWORK MODERATION
// ==========================================

router.get(
  "/artworks/pending",
  protect,
  authorize("ADMIN"),
  getPendingArtworks
);

router.put(
  "/artworks/:id/approve",
  protect,
  authorize("ADMIN"),
  approveArtwork
);

router.put(
  "/artworks/:id/reject",
  protect,
  authorize("ADMIN"),
  rejectArtwork
);

// ==========================================
// FEATURE / UNFEATURE ARTWORK
// ==========================================

router.put(
  "/artworks/:id/featured",
  protect,
  authorize("ADMIN"),
  updateArtworkFeaturedStatus
);

// ==========================================
// ACTIVATE / DEACTIVATE ARTWORK
// ==========================================

router.put(
  "/artworks/:id/status",
  protect,
  authorize("ADMIN"),
  updateArtworkStatus
);

module.exports = router;