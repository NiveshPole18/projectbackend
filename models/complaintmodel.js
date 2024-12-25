// complaintModel.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  userType: { type: String, required: true },
  // userType: { type: String, enum: ['customer', 'seller'], required: true },
  date: { type: String, required: true }
});

module.exports = mongoose.model('Complaint', complaintSchema);
