
const mongoose = require("mongoose");
const Artwork = require("../models/Artwork");
const Order = require("../models/Order");

// 1. Artist dashboard statistics
const getArtistDashboardStats = async (req, res) => {
  try {
    const artistId = req.user._id;

    const [
      totalArtworks,
      pendingArtworks,
      approvedArtworks,
      rejectedArtworks,
      inactiveArtworks,
      availableArtworks,
      soldArtworks,
      orderStats,
    ] = await Promise.all([
      Artwork.countDocuments({ artist: artistId }),
      Artwork.countDocuments({ artist: artistId, status: "PENDING" }),
      Artwork.countDocuments({ artist: artistId, status: "APPROVED" }),
      Artwork.countDocuments({ artist: artistId, status: "REJECTED" }),
      Artwork.countDocuments({ artist: artistId, isActive: false }),
      Artwork.countDocuments({
        artist: artistId,
        availability: "AVAILABLE",
        status: "APPROVED",
        isActive: true,
      }),
      Artwork.countDocuments({
        artist: artistId,
        availability: "SOLD",
      }),
      Order.aggregate([
        { $match: { "items.artist": artistId } },
        { $unwind: "$items" },
        { $match: { "items.artist": artistId } },
        {
          $group: {
            _id: null,
            totalUnitsSold: {
              $sum: {
                $cond: [
                  { $ne: ["$orderStatus", "CANCELLED"] },
                  "$items.quantity",
                  0,
                ],
              },
            },
            totalOrders: {
              $addToSet: {
                $cond: [
                  { $ne: ["$orderStatus", "CANCELLED"] },
                  "$_id",
                  null,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalUnitsSold: 1,
            totalOrders: {
              $size: {
                $setDifference: ["$totalOrders", [null]],
              },
            },
          },
        },
      ]),
    ]);

    const sales = orderStats[0] || {
      totalUnitsSold: 0,
      totalOrders: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        artworks: {
          total: totalArtworks,
          pending: pendingArtworks,
          approved: approvedArtworks,
          rejected: rejectedArtworks,
          inactive: inactiveArtworks,
          available: availableArtworks,
          sold: soldArtworks,
        },
        sales: {
          totalUnitsSold: sales.totalUnitsSold,
          totalOrders: sales.totalOrders,
        },
      },
    });
  } catch (error) {
    console.error("Artist Dashboard Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get artist dashboard statistics",
    });
  }
};


// 2. Artist revenue
const getArtistRevenue = async (req, res) => {
  try {
    const artistId = req.user._id;

    const results = await Order.aggregate([
      { $match: { "items.artist": artistId } },
      { $unwind: "$items" },
      { $match: { "items.artist": artistId } },
      {
        $group: {
          _id: null,

          // Value of this artist's items in non-cancelled orders
          totalSales: {
            $sum: {
              $cond: [
                { $ne: ["$orderStatus", "CANCELLED"] },
                "$items.subtotal",
                0,
              ],
            },
          },

          // Sales from delivered orders
          deliveredRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$orderStatus", "DELIVERED"] },
                "$items.subtotal",
                0,
              ],
            },
          },

          // Revenue from orders marked as paid
          paidRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "PAID"] },
                "$items.subtotal",
                0,
              ],
            },
          },

          deliveredOrders: {
            $addToSet: {
              $cond: [
                { $eq: ["$orderStatus", "DELIVERED"] },
                "$_id",
                null,
              ],
            },
          },

          pendingOrders: {
            $addToSet: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$orderStatus", "DELIVERED"] },
                    { $ne: ["$orderStatus", "CANCELLED"] },
                  ],
                },
                "$_id",
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          deliveredRevenue: 1,
          paidRevenue: 1,
          deliveredOrders: {
            $size: {
              $setDifference: ["$deliveredOrders", [null]],
            },
          },
          pendingOrders: {
            $size: {
              $setDifference: ["$pendingOrders", [null]],
            },
          },
        },
      },
    ]);

    const revenue = results[0] || {
      totalSales: 0,
      deliveredRevenue: 0,
      paidRevenue: 0,
      deliveredOrders: 0,
      pendingOrders: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        currency: "INR",
        revenue,
      },
    });
  } catch (error) {
    console.error("Artist Revenue Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get artist revenue",
    });
  }
};


// 3. Artwork statistics
const getArtistArtworkStats = async (req, res) => {
  try {
    const artistId = req.user._id;

    const [statusStats, availabilityStats] = await Promise.all([
      Artwork.aggregate([
        { $match: { artist: artistId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Artwork.aggregate([
        { $match: { artist: artistId } },
        {
          $group: {
            _id: "$availability",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const formatStats = (stats, keys) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = 0;
      });

      stats.forEach((item) => {
        result[item._id] = item.count;
      });

      return result;
    };

    return res.status(200).json({
      success: true,
      data: {
        byStatus: formatStats(statusStats, [
          "PENDING",
          "APPROVED",
          "REJECTED",
        ]),
        byAvailability: formatStats(availabilityStats, [
          "AVAILABLE",
          "SOLD",
          "RESERVED",
          "COMING_SOON",
        ]),
      },
    });
  } catch (error) {
    console.error("Artist Artwork Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get artist artwork statistics",
    });
  }
};


// 4. Recent orders containing this artist's artworks
const getRecentArtistOrders = async (req, res) => {
  try {
    const artistId = req.user._id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50
    );
    const skip = (page - 1) * limit;

    const filter = {
      "items.artist": artistId,
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("customer", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const artistOrders = orders.map((order) => {
      // Only return this artist's order items, not other artists' items.
      const artistItems = order.items.filter(
        (item) => item.artist.toString() === artistId.toString()
      );

      const artistSubtotal = artistItems.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        items: artistItems,
        artistSubtotal,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        orders: artistOrders,
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
    console.error("Recent Artist Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get recent artist orders",
    });
  }
};


module.exports = {
  getArtistDashboardStats,
  getArtistRevenue,
  getArtistArtworkStats,
  getRecentArtistOrders,
};