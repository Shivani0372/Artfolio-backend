const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Artwork = require("../models/Artwork");
const Order = require("../models/Order");

const generateOrderNumber = () => {
  const timestamp = Date.now();

  const random = Math.floor(1000 + Math.random() * 9000);

  return `ORD-${timestamp}-${random}`;
};

// Checkout
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      shippingAddress,
      paymentMethod = "COD",
    } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const requiredFields = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
    ];

    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    let createdOrder;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({
        user: req.user._id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error("Your cart is empty");
      }

      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cart.items) {
        const artwork = await Artwork.findOne({
          _id: cartItem.artwork,
          status: "APPROVED",
          isActive: true,
          availability: "AVAILABLE",
        }).session(session);

        if (!artwork) {
          throw new Error(
            "One or more artworks in your cart are no longer available"
          );
        }

        if (artwork.stock < cartItem.quantity) {
          throw new Error(
            `Insufficient stock for "${artwork.title}". Available stock: ${artwork.stock}`
          );
        }

        const itemSubtotal =
          artwork.price * cartItem.quantity;

        subtotal += itemSubtotal;

        orderItems.push({
          artwork: artwork._id,
          artist: artwork.artist,
          title: artwork.title,
          image:
            artwork.images && artwork.images.length > 0
              ? artwork.images[0].url
              : "",
          price: artwork.price,
          quantity: cartItem.quantity,
          subtotal: itemSubtotal,
        });

        artwork.stock -= cartItem.quantity;

        if (artwork.stock === 0) {
          artwork.availability = "SOLD";
        }

        await artwork.save({ session });
      }

      const shippingFee = subtotal >= 5000 ? 0 : 100;

      const totalAmount = subtotal + shippingFee;

      const order = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            customer: req.user._id,
            items: orderItems,
            shippingAddress,
            subtotal,
            shippingFee,
            totalAmount,
            paymentMethod,
            paymentStatus:
              paymentMethod === "COD"
                ? "PENDING"
                : "PENDING",
            orderStatus: "PLACED",
          },
        ],
        { session }
      );

      cart.items = [];

      await cart.save({ session });

      createdOrder = order[0];
    });

    await createdOrder.populate([
      {
        path: "customer",
        select: "name email",
      },
      {
        path: "items.artist",
        select: "name email",
      },
      {
        path: "items.artwork",
        select: "title images",
      },
    ]);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  } finally {
    await session.endSession();
  }
};

// Customer order history
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    })
      .populate("items.artist", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Get single customer order
const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    }).populate([
      {
        path: "customer",
        select: "name email",
      },
      {
        path: "items.artist",
        select: "name email avatar",
      },
      {
        path: "items.artwork",
        select: "title images category",
      },
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// Artist sales
const getArtistOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      "items.artist": req.user._id,
    })
      .populate("customer", "name email")
      .populate("items.artwork", "title images")
      .sort({ createdAt: -1 });

    const artistOrders = orders.map((order) => {
      const artistItems = order.items.filter(
        (item) =>
          item.artist.toString() === req.user._id.toString()
      );

      const artistTotal = artistItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        items: artistItems,
        artistTotal,
      };
    });

    res.status(200).json({
      success: true,
      count: artistOrders.length,
      orders: artistOrders,
    });
  } catch (error) {
    console.error("Get artist orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch artist orders",
      error: error.message,
    });
  }
};

// Update order status by artist
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      "items.artist": req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = status;

    if (status === "DELIVERED") {
      order.paymentStatus =
        order.paymentMethod === "COD"
          ? "PAID"
          : order.paymentStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// Customer cancels order
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: req.params.id,
        customer: req.user._id,
      }).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      if (
        !["PLACED", "CONFIRMED"].includes(order.orderStatus)
      ) {
        throw new Error(
          "This order cannot be cancelled now"
        );
      }

      for (const item of order.items) {
        const artwork = await Artwork.findById(
          item.artwork
        ).session(session);

        if (artwork) {
          artwork.stock += item.quantity;

          if (
            artwork.stock > 0 &&
            artwork.status === "APPROVED" &&
            artwork.isActive
          ) {
            artwork.availability = "AVAILABLE";
          }

          await artwork.save({ session });
        }
      }

      order.orderStatus = "CANCELLED";
      order.cancelledAt = new Date();
      order.cancellationReason =
        req.body.reason || "Cancelled by customer";

      await order.save({ session });

      cancelledOrder = order;
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getArtistOrders,
  updateOrderStatus,
  cancelOrder,
};