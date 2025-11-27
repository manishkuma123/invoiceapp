const mongoose = require("mongoose")
const clientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  mobile: {
    countryCode: {
      type: String,
      default: '+91'
    },
    number: {
      type: String,
      required: true
    }
  },
  tax: {
    type: String,
    trim: true
  },
 
  billingAddress: {
    country: {
      type: String,
      required: true
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    addressLine2: {
      type: String,
      trim: true
    },
    townCity: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pinCode: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  sameAsBilling: {
    type: Boolean,
    default: false
  },
  deliveryAddress: {
    firstName: String,
    lastName: String,
    businessName: String,
    country: String,
    addressLine1: String,
    addressLine2: String,
    townCity: String,
    state: String,
    pinCode: String
  },
  
  country: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  note: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;