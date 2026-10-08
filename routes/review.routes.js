const express = require("express");

const {
  createReview,
  getArtworkReviews,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Public reviews
router.get(
  "/artwork/:artworkId",
  getArtworkReviews
);

// Customer review
router.post(
  "/",
  protect,
  authorize("CUSTOMER"),
  createReview
);

// Customer own review
router.put(
  "/:id",
  protect,
  authorize("CUSTOMER"),
  updateReview
);

router.delete(
  "/:id",
  protect,
  authorize("CUSTOMER"),
  deleteReview
);

module.exports = router;