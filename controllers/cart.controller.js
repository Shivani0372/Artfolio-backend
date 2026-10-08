const Cart = require("../models/Cart");
const Artwork = require("../models/Artwork");

// Helper
const populateCart = async (cart) => {
  return await cart.populate({
    path: "items.artwork",
    populate: [
      {
        path: "artist",
        select: "name email avatar",
      },
      {
        path: "category",
        select: "name",
      },
    ],
  });
};

// Get cart
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
        },
      });
    }

    cart = await populateCart(cart);

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

// Add artwork to cart
const addToCart = async (req, res) => {
  try {
    const { artworkId, quantity = 1 } = req.body;

    if (!artworkId) {
      return res.status(400).json({
        success: false,
        message: "Artwork ID is required",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const artwork = await Artwork.findOne({
      _id: artworkId,
      status: "APPROVED",
      isActive: true,
    });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    if (artwork.availability !== "AVAILABLE") {
      return res.status(400).json({
        success: false,
        message: "Artwork is not currently available",
      });
    }

    if (artwork.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${artwork.stock} item(s) available`,
      });
    }

    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [
          {
            artwork: artworkId,
            quantity,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.artwork.toString() === artworkId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > artwork.stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${artwork.stock} item(s) available`,
          });
        }

        existingItem.quantity = newQuantity;
      } else {
        cart.items.push({
          artwork: artworkId,
          quantity,
        });
      }

      await cart.save();
    }

    cart = await populateCart(cart);

    res.status(200).json({
      success: true,
      message: "Artwork added to cart",
      cart,
    });
  } catch (error) {
    console.error("Add cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add artwork to cart",
      error: error.message,
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const artwork = await Artwork.findOne({
      _id: artworkId,
      status: "APPROVED",
      isActive: true,
    });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    if (quantity > artwork.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${artwork.stock} item(s) available`,
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.artwork.toString() === artworkId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found in cart",
      });
    }

    item.quantity = quantity;

    await cart.save();

    const populatedCart = await populateCart(cart);

    res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: populatedCart,
    });
  } catch (error) {
    console.error("Update cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
};

// Remove item
const removeFromCart = async (req, res) => {
  try {
    const { artworkId } = req.params;

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.artwork.toString() !== artworkId
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Artwork removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Remove cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove artwork",
      error: error.message,
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("Clear cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};