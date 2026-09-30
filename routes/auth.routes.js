//Our endpoints are now:
// POST /api/v1/auth/register
// POST /api/v1/auth/login
// GET  /api/v1/auth/me

const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route
router.get("/me", protect, getMe);

module.exports = router;