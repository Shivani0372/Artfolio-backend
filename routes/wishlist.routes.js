const express = require("express");

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
} = require("../controllers/wishlist.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("CUSTOMER"),
  getWishlist
);

router.post(
  "/",
  protect,
  authorize("CUSTOMER"),
  addToWishlist
);

router.delete(
  "/:artworkId",
  protect,
  authorize("CUSTOMER"),
  removeFromWishlist
);

router.delete(
  "/",
  protect,
  authorize("CUSTOMER"),
  clearWishlist
);

module.exports = router;