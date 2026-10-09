
const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");
const Cart = require("../models/Cart");

// 1. Customer dashboard statistics
const getCustomerDashboardStats = async (req, res) => {
  try {
    const customerId = req.user._id;

    const [
      totalOrders,
      placedOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      paidOrders,
      spendingResult,
    ] = await Promise.all([
      Order.countDocuments({ customer: customerId }),
      Order.countDocuments({
        customer: customerId,
        orderStatus: "PLACED",
      }),
      Order.countDocuments({
        customer: customerId,
        orderStatus: "CONFIRMED",
      }),
      Order.countDocuments({
        customer: customerId,
        orderStatus: "PROCESSING",
      }),
      Order.countDocuments({
        customer: customerId,
        orderStatus: "SHIPPED",
      }),
      Order.countDocuments({
        customer: customerId,
        orderStatus: "DELIVERED",
      }),
      Order.countDocuments({
        customer: customerId,
        orderStatus: "CANCELLED",
      }),
      Order.countDocuments({
        customer: customerId,
        paymentStatus: "PAID",
      }),
      Order.aggregate([
        {
          $match: {
            customer: customerId,
            paymentStatus: "PAID",
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    const totalSpent = spendingResult[0]?.totalSpent || 0;

    return res.status(200).json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          placed: placedOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          paid: paidOrders,
        },
        spending: {
          currency: "INR",
          totalSpent,
        },
      },
    });
  } catch (error) {
    console.error("Customer Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get customer dashboard statistics",
    });
  }
};


// 2. Customer order summary and recent orders
const getCustomerOrderSummary = async (req, res) => {
  try {
    const customerId = req.user._id;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 5, 1),
      50
    );
    const skip = (page - 1) * limit;

    const filter = { customer: customerId };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select(
          "orderNumber items subtotal shippingFee totalAmount paymentMethod paymentStatus orderStatus createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const recentOrders = orders.map((order) => ({
      ...order,
      itemCount: order.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
    }));

    return res.status(200).json({
      success: true,
      data: {
        orders: recentOrders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Customer Order Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get customer order summary",
    });
  }
};


// 3. Customer wishlist and cart counts
const getCustomerWishlistCartCounts = async (req, res) => {
  try {
    const customerId = req.user._id;

    const [wishlist, cart] = await Promise.all([
      Wishlist.findOne({ user: customerId })
        .select("artworks")
        .lean(),
      Cart.findOne({ user: customerId })
        .select("items")
        .lean(),
    ]);

    const wishlistCount = wishlist?.artworks?.length || 0;
    const cartItems = cart?.items || [];

    const distinctCartItems = cartItems.length;
    const totalCartQuantity = cartItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        wishlist: {
          artworkCount: wishlistCount,
        },
        cart: {
          distinctArtworkCount: distinctCartItems,
          totalQuantity: totalCartQuantity,
        },
      },
    });
  } catch (error) {
    console.error("Customer Wishlist Cart Counts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get wishlist and cart counts",
    });
  }
};


module.exports = {
  getCustomerDashboardStats,
  getCustomerOrderSummary,
  getCustomerWishlistCartCounts,
};