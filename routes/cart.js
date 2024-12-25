const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/cartmodel');
const Order=require('../models/order')
// const Order = require('../models/complaintmodel'); // Replace with correct path
const User = require('../models/user'); // Replace with correct path
const Product = require('../models/product'); // Replace with correct path
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // Convert string to boolean
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});


// Add to Cart Route
router.post('/addtocart', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res.status(400).json({ success: false, message: 'userId, productId, and quantity are required.' });
    }

    let cart = await Cart.findOne({ userId });
    const productQty = parseInt(quantity);

    if (cart) {
      // Check if product already exists in the cart
      const existingProduct = cart.productsInCart.find(item => item.productId === productId);
      if (existingProduct) {
        existingProduct.productQty += productQty; // Update quantity if product already exists
      } else {
        cart.productsInCart.push({ productId, productQty }); // Add new product
      }
      await cart.save();
    } else {
      cart = new Cart({ userId, productsInCart: [{ productId, productQty }] });
      await cart.save();
    }

    res.status(200).json({ success: true, message: 'Product added to cart successfully', cart });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ success: false, message: 'Error adding product to cart', error: error.message });
  }
});

// Get Cart by User ID Route
router.post('/get-cart', async (req, res) => {
  try {
    const { userId } = req.body;
    const cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found for this user' });

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cart', error: error.message });
  }
});

router.put('/update-quantity', async (req, res) => {
  const { userId, productId, productQty } = req.body;

  if (!userId || !productId || typeof productQty !== 'number') {
    return res.status(400).json({ message: 'userId, productId, and a valid productQty are required.' });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    const product = cart.productsInCart.find(item => item.productId === productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found in the cart.' });
    }

    product.productQty = productQty;
    await cart.save();

    res.status(200).json({ message: 'Quantity updated successfully.' });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ message: 'An error occurred while updating the quantity.' });
  }
});
// Delete Item from Cart Route
router.post('/delete-items', async (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: 'userId and productId are required.' });
  }

  try {
    const result = await Cart.updateOne(
      { userId },
      { $pull: { productsInCart: { productId } } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Item deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Item not found in the cart.' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'An error occurred while deleting the item.' });
  }
});

// Route to update quantity

// Place Order Route
router.post('/place-order', async (req, res) => {
  console.log('Incoming request data:', req.body);
  try {
    // Log which model we're using to verify
    console.log('Model being used:', mongoose.model('Order').modelName);
    console.log('Available models:', Object.keys(mongoose.models));

    const { userId, name, email, items, price, address } = req.body;

    // Validate required fields
    if (!userId || !name || !email || !items || !Array.isArray(items) || items.length === 0 || price === undefined || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required and cart must not be empty.',
        missingFields: {
          userId: !userId,
          name: !name,
          email: !email,
          items: !items || !Array.isArray(items) || items.length === 0,
          price: price === undefined,
          address: !address
        }
      });
    }

    // Create order document
    const orderData = {
      orderId: 'ORDER-' + Date.now(),
      userId,
      name,
      email,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      price,
      address
    };

    // Log the order data before saving
    console.log('Order data to be saved:', orderData);

    // Create and save the order
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    // Clear the user's cart
    await Cart.findOneAndUpdate(
      { userId }, 
      { $set: { productsInCart: [] } }
    );

    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully',
      order: savedOrder 
    });

  } catch (error) {
    console.error('Error placing order:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to place order', 
      error: error.message,
      modelName: mongoose.model('Order').modelName,
      availableModels: Object.keys(mongoose.models)
    });
  }
});




// Get Product by ID Route
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(`Fetching product with ID: ${productId}`); // Debugging log
    const product = await Product.findOne({ productId });

    if (!product) {
      console.log(`Product not found: ${productId}`); // Debugging log
      return res.status(404).json({
        success: false, 
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Clear Cart Route
router.post('/clear-cart', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    // Clear the cart for the user
    const result = await Cart.findOneAndUpdate(
      { userId },
      { $set: { productsInCart: [] } }, // Set productsInCart to an empty array
      { new: true } // Return the updated document
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Cart not found for this user.' });
    }

    res.status(200).json({ success: true, message: 'Cart cleared successfully.' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
});

module.exports = router;