const mongoose = require('mongoose');



const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  price: { type: Number, required: true },
  address: { type: String, required: true },
  date: { type: Date, default: Date.now }
  
});

// Clear any existing model to prevent conflicts
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

