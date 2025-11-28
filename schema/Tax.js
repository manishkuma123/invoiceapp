const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  percentage: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const TAX = mongoose.model('TAX', taxSchema);
module.exports = TAX;
