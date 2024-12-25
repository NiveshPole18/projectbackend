// complaintRoutes.js
const express = require('express');
const nodemailer = require('nodemailer');
const Complaint = require('../models/complaintmodel');  // Import the Complaint model
const router = express.Router();
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default to Gmail SMTP
  port: process.env.SMTP_PORT || 587, // Default to 587
  secure: process.env.SMTP_SECURE === 'true', // Convert string to boolean
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Function to generate a unique complaint number
function generateComplaintNumber() {
  return 'C-' + Math.floor(100000 + Math.random() * 900000); // Example: generates a complaint number like C-123456
}

// Function to send confirmation email
const sendConfirmationEmail = async (email, complaintNumber, message) => {
  try {
    const mailOptions = {
      from: '"Mera Bestie" <your-email@gmail.com>',
      to: email,
      subject: 'Complaint Registration Confirmation',
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px; background-color: #ffffff;">
          <!-- Stylish Header -->
          <div style="background-color: #ffb6c1; padding: 15px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="font-family: 'Brush Script MT', cursive; color: #ffffff; font-size: 36px; margin: 0;">Mera Bestie</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 20px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Complaint Registration Confirmation</h2>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintNumber}</p>
              <p style="margin: 10px 0;"><strong>Issue Description:</strong></p>
              <p style="margin: 10px 0; font-style: italic; color: #555;">${message}</p>
            </div>
            <p style="color: #7f8c8d; font-size: 16px; line-height: 1.5;">
              Thank you for reaching out to us! Our experienced specialists are already working on resolving your issue. You can expect a detailed reply to your query within 24 hours. We appreciate your patience and understanding.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #95a5a6; font-size: 12px; line-height: 1.4;">
              This is an automated email. Please do not reply to this message.<br>
              If you have any additional questions, feel free to contact our support team.
            </p>
          </div>
        </div>
      `,
      text: `
        Mera Bestie

        Complaint Registration Confirmation

        Complaint ID: ${complaintNumber}

        Issue Description:
        ${message}

        Thank you for reaching out to us! Our experienced specialists are already working on resolving your issue. You can expect a detailed reply to your query within 24 hours. We appreciate your patience and understanding.

        This is an automated email. Please do not reply to this message.
        If you have any additional questions, feel free to contact our support team.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

// Post Complaint Route
router.post('/post-complaints', async (req, res) => {
  console.log('Incoming request data:', req.body); // Log the incoming request data
  try {
    const { name, email, message, userType } = req.body;
    // console.log('Incoming request data:', req.body);
    // Validate required fields
    if (!name || !email || !message || !userType) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
   
    // Create a new complaint
    const newComplaint = new Complaint({
      name,
      email,
      message,
      userType:userType,
      complaintNumber: generateComplaintNumber(), // Use the defined function
      date: new Date().toISOString()
    });

    // Save the complaint to the database
    await newComplaint.save();

    // Optionally send a confirmation email
    await sendConfirmationEmail(email, newComplaint.complaintNumber, message);

    res.status(201).json({ success: true, message: 'Complaint registered successfully', complaint: newComplaint });
  } catch (error) {
    console.error('Error registering complaint:', error); // Log the error
    res.status(500).json({ success: false, message: 'Failed to register complaint', error: error.message });
  }
});

// Get All Complaints Route
router.get('/get-complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find();
    
    res.status(200).json({
      success: true,
      complaints
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching complaints',
      error: error.message
    });
  }
});

// Update Complaint Status Route
router.put('/update-complaint-status', async (req, res) => {
  try {
    const { complaintId, status } = req.body;

    const updatedComplaint = await Complaint.findOneAndUpdate(
      { complaintNumber: complaintId },
      { $set: { status } },
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
      complaint: updatedComplaint
    });

  } catch (error) {
    res.status(500).json({
      success: false, 
      message: 'Error updating complaint status',
      error: error.message
    });
  }
});

module.exports = router;
