const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cart.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("CUSTOMER"),
  getCart
);

router.post(
  "/",
  protect,
  authorize("CUSTOMER"),
  addToCart
);

router.put(
  "/:artworkId",
  protect,
  authorize("CUSTOMER"),
  updateCartItem
);

router.delete(
  "/:artworkId",
  protect,
  authorize("CUSTOMER"),
  removeFromCart
);

router.delete(
  "/",
  protect,
  authorize("CUSTOMER"),
  clearCart
);

module.exports = router;