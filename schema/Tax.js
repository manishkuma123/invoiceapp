const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, 
    trim: true
  },
   percentage: {
        type: Number,
        required: true,
        unique: true,
        trim: true
    },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 
  }
});

const TAX = mongoose.model('TAX', otpSchema);
module.exports =  TAX ;