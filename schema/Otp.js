const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  otp: { 
    type: String, 
    required: true 
  },
  purpose: { 
    type: String, 
    enum: ['signup', 'login'], 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 
  }
});

const OTP = mongoose.model('OTP', otpSchema);
module.exports =  OTP;