
const express = require("express");

const {
  getCustomerDashboardStats,
  getCustomerOrderSummary,
  getCustomerWishlistCartCounts,
} = require("../controllers/customerDashboard.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Only authenticated customers can access these APIs.
router.use(protect, authorize("CUSTOMER"));

router.get("/stats", getCustomerDashboardStats);
router.get("/orders", getCustomerOrderSummary);
router.get("/wishlist-cart", getCustomerWishlistCartCounts);

module.exports = router;