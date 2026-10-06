const express = require("express");

const {
  getPendingArtworks,
  approveArtwork,
  rejectArtwork,
} = require("../controllers/admin.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

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

module.exports = router;