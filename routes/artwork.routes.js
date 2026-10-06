const express = require("express");

const {
  createArtwork,
  getArtworks,
  getArtworkById,
  getMyArtworks,
  updateArtwork,
  deleteArtwork,
} = require("../controllers/artwork.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Public
router.get("/", getArtworks);
router.get("/:id", getArtworkById);

// Artist
router.get(
  "/artist/my-artworks",
  protect,
  authorize("ARTIST"),
  getMyArtworks
);

router.post(
  "/",
  protect,
  authorize("ARTIST"),
  createArtwork
);

router.put(
  "/:id",
  protect,
  authorize("ARTIST"),
  updateArtwork
);

router.delete(
  "/:id",
  protect,
  authorize("ARTIST"),
  deleteArtwork
);

module.exports = router;