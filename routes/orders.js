const express = require('express');
const router = express.Router();
const Order = require('../models/order'); // Adjust the path as needed

// Fetch a specific order by Order ID Route
router.get('/order/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId; // Get orderId from the route parameters
    const order = await Order.findOne({ orderId: orderId }) // Find the order by orderId
      .select('orderId items') // Adjust the fields you want to return
      .lean(); // Use lean() for better performance if you don't need Mongoose documents

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Error fetching order', error: error.message });
  }
});

// Fetch all orders for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId; // Get userId from the route parameters
    const orders = await Order.find({ userId: userId }) // Find all orders for the user
      .select('orderId items date price') // Adjust the fields you want to return
      .sort({ date: -1 }) // Sort orders by date in descending order
      .lean(); // Use lean() for better performance if you don't need Mongoose documents

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "No orders found for this user" });
    }

    res.json({ success: true, orders: orders });
  } catch (error) {
    console.error('Error fetching orders for user:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
});

module.exports = router;
