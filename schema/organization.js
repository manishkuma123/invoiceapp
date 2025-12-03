const mongoose = require('mongoose');
const organizationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  organizationName: { 
    type: String, 
    required: true,
    trim: true
  },
  businessType: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  state: { 
    type: String,
    trim: true
  },
  country: {  
    type: String,
    trim: true
  },
  

  currency: { 
    type: String,
    default: 'USD'
  },
  language: { 
    type: String,
    default: 'English'
  },
  signature: { 
    type: String 
  },
  companySealing: { 
    type: String 
  },
  logo: { 
    type: String 
  },
  isSetupComplete: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports =  Organization ;