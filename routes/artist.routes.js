const express = require("express");

const {
  createArtistProfile,
  getMyArtistProfile,
  updateArtistProfile,
  getArtistProfile,
} = require("../controllers/artist.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Artist profile routes FIRST
router.post(
  "/profile",
  protect,
  authorize("ARTIST"),
  createArtistProfile
);

router.get(
  "/profile/me",
  protect,
  authorize("ARTIST"),
  getMyArtistProfile
);

router.put(
  "/profile/me",
  protect,
  authorize("ARTIST"),
  updateArtistProfile
);

// Public artist profile
router.get("/:id", getArtistProfile);

module.exports = router;