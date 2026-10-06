const express = require("express");

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// Public
router.get("/", getCategories);

// Admin
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createCategory
);

router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateCategory
);

router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteCategory
);

module.exports = router;