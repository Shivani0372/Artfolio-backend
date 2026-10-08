const express = require("express");

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getArtistOrders,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/order.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Customer checkout
router.post(
  "/",
  protect,
  authorize("CUSTOMER"),
  createOrder
);

// Customer orders
router.get(
  "/my-orders",
  protect,
  authorize("CUSTOMER"),
  getMyOrders
);

router.get(
  "/my-orders/:id",
  protect,
  authorize("CUSTOMER"),
  getMyOrderById
);

router.put(
  "/my-orders/:id/cancel",
  protect,
  authorize("CUSTOMER"),
  cancelOrder
);

// Artist sales
router.get(
  "/artist/sales",
  protect,
  authorize("ARTIST"),
  getArtistOrders
);

router.put(
  "/artist/:id/status",
  protect,
  authorize("ARTIST"),
  updateOrderStatus
);

module.exports = router;