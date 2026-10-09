
const express = require("express");

const {
  getArtistDashboardStats,
  getArtistRevenue,
  getArtistArtworkStats,
  getRecentArtistOrders,
} = require("../controllers/artistDashboard.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Every endpoint requires a logged-in ARTIST.
router.use(protect, authorize("ARTIST"));

router.get("/stats", getArtistDashboardStats);
router.get("/revenue", getArtistRevenue);
router.get("/artworks", getArtistArtworkStats);
router.get("/orders/recent", getRecentArtistOrders);

module.exports = router;